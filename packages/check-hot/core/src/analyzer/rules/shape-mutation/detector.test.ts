import { parseSync } from "oxc-parser";
import { describe, expect, test } from "vitest";

import { nodeName, walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { CandidateNode, ParsedFile } from "../../internal-model.js";
import type { AddFinding } from "../shared.js";
import { analyzerFixture } from "../test-fixture.test-utils.js";
import { detectShapeMutation, initializedClassProperties } from "./detector.js";
import {
    objectShapeExperiment,
    prototypeChainExperiment
} from "./experiment.js";

const analyze = analyzerFixture("shape", "ts");

const parsedFile = (source: string): ParsedFile => {
    const parsed = parseSync("fixture.ts", source, {
        sourceType: "module",
        astType: "ts"
    });
    return {
        file: "fixture.ts",
        source,
        program: parsed.program,
        module: parsed.module,
        comments: parsed.comments,
        dependencies: new Map()
    };
};

const classNamed = (parsed: ParsedFile, name: string) => {
    let matched: AstNode | undefined;
    walk(parsed.program as unknown as AstNode, [], node => {
        if (
            !matched &&
            (node.type === "ClassDeclaration" ||
                node.type === "ClassExpression") &&
            nodeName(node.id) === name
        ) {
            matched = node;
            return false;
        }
    });
    return matched;
};

const methodCandidate = (
    node: AstNode,
    name = "update",
    kind: CandidateNode["kind"] = "method"
): CandidateNode => ({
    node,
    runtimeNode: node,
    stripStaticRuntimePrefix: false,
    name,
    kind,
    exported: false,
    publicTargets: [],
    publicPaths: [],
    arity: 0,
    parameterNames: [],
    parameterBindings: []
});
const synthetic = (type: string, properties: Record<string, unknown> = {}) =>
    ({ type, start: 0, end: 1, ...properties }) as AstNode;

describe("shape mutation detector", () => {
    test("keeps exact object-shape and prototype variant contracts", () => {
        const seed = { x: 1, y: 2 };
        const shapes = objectShapeExperiment.variants.map((_, index) =>
            objectShapeExperiment.mutate(seed, index)
        );

        expect(shapes).toHaveLength(6);
        expect(Reflect.ownKeys(shapes[0] as object)).toEqual(["x", "y"]);
        expect(Reflect.ownKeys(shapes[4] as object)).toEqual(["x"]);
        expect(
            Object.getPrototypeOf(prototypeChainExperiment.mutate(seed, 1))
        ).toBeNull();
    });

    test("does not flag constructor or declared-field updates as late writes", async () => {
        const report = await analyze(
            [
                "export class Model {",
                "  optional?: number;",
                "  constructor() { this.value = 1; }",
                "  update() { this.value = 2; this.optional = 3; this.late = 4; }",
                "}"
            ].join("\n")
        );
        const lateWrites = report.findings.filter(
            value => value.rule === "late-instance-property-write"
        );

        expect(lateWrites).toHaveLength(1);
        expect(lateWrites[0].sourceLine).toContain("this.late");
    });

    test("uses exact class identity for same-name and anonymous classes", async () => {
        const report = await analyze(
            [
                "{ class Model { first = 1; update() { this.first = 2; this.second = 3; } } }",
                "{ class Model { second = 1; update() { this.second = 2; this.first = 3; } } }",
                "export default class { field = 1; update() { this.field = 2; this.late = 3; } }"
            ].join("\n")
        );
        const lateWrites = report.findings
            .filter(value => value.rule === "late-instance-property-write")
            .map(value => value.sourceLine.trim());

        expect(lateWrites).toHaveLength(3);
        expect(lateWrites).toEqual(
            expect.arrayContaining([
                expect.stringContaining("this.second = 3"),
                expect.stringContaining("this.first = 3"),
                expect.stringContaining("this.late = 3")
            ])
        );
    });

    test("does not treat static fields as initialized instance properties", async () => {
        const report = await analyze(
            "export class Model { static shared = 1; static constructor() { this.ready = 1; } update() { this.shared = 2; this.ready = 2; } }"
        );

        expect(
            report.findings.filter(
                value => value.rule === "late-instance-property-write"
            )
        ).toHaveLength(2);
    });

    test("reports dot and computed legacy prototype assignments without a duplicate late-write warning", async () => {
        const report = await analyze(
            [
                "export class Model {",
                "  update(first, second) {",
                "    this.__proto__ = first;",
                "    second['__proto__'] = null;",
                "  }",
                "}"
            ].join("\n")
        );
        const prototypeWrites = report.findings.filter(
            value => value.rule === "shape-or-prototype-mutation"
        );

        expect(prototypeWrites).toHaveLength(2);
        expect(prototypeWrites).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: "warning",
                    message:
                        "An assignment to __proto__ may invoke the legacy prototype setter and invalidate prototype-chain assumptions.",
                    suggestion:
                        "Prefer Object.setPrototypeOf during structural setup, or verify that the receiver intentionally owns a data property named __proto__.",
                    sourceLine: expect.stringContaining("this.__proto__")
                }),
                expect.objectContaining({
                    severity: "warning",
                    message:
                        "An assignment to __proto__ may invoke the legacy prototype setter and invalidate prototype-chain assumptions.",
                    suggestion:
                        "Prefer Object.setPrototypeOf during structural setup, or verify that the receiver intentionally owns a data property named __proto__.",
                    sourceLine: expect.stringContaining("second['__proto__']")
                })
            ])
        );
        expect(
            report.findings.filter(
                value => value.rule === "late-instance-property-write"
            )
        ).toEqual([]);
    });

    test("respects shadowed Object and Reflect bindings", async () => {
        const report = await analyze(
            "export function hot(Object, Reflect) { Object.setPrototypeOf({}, null); Reflect.defineProperty({}, 'x', { value: 1 }); }"
        );

        expect(report.findings.map(value => value.rule)).not.toContain(
            "shape-or-prototype-mutation"
        );
    });

    test("reports every global shape/prototype mutator with an actionable contract", async () => {
        const report = await analyze(
            [
                "export function hot(target) {",
                "  Object.defineProperty(target, 'a', { value: 1 });",
                "  Object.setPrototypeOf(target, null);",
                "  Reflect.defineProperty(target, 'b', { value: 2 });",
                "  Reflect.setPrototypeOf(target, null);",
                "  Object.freeze(target);",
                "}"
            ].join("\n")
        );
        const findings = report.findings.filter(
            value => value.rule === "shape-or-prototype-mutation"
        );

        expect(findings).toHaveLength(4);
        expect(
            findings.map(({ severity, message, suggestion, sourceLine }) => ({
                severity,
                message,
                suggestion,
                sourceLine: sourceLine.trim()
            }))
        ).toEqual(
            [
                "Object.defineProperty",
                "Object.setPrototypeOf",
                "Reflect.defineProperty",
                "Reflect.setPrototypeOf"
            ].map(label => ({
                severity: "critical",
                message: `${label} can invalidate hidden-class or prototype-chain assumptions.`,
                suggestion:
                    "Move structural initialization out of the hot phase or add before/after map and deopt checks.",
                sourceLine: expect.stringContaining(`${label}(`)
            }))
        );
    });

    test("shadows Object and Reflect independently", async () => {
        const objectShadow = await analyze(
            "export function objectShadow(Object, target) { Object.defineProperty(target, 'x', {}); Reflect.defineProperty(target, 'y', {}); }"
        );
        const reflectShadow = await analyze(
            "export function reflectShadow(Reflect, target) { Object.setPrototypeOf(target, null); Reflect.setPrototypeOf(target, null); }"
        );

        expect(
            objectShadow.findings
                .filter(value => value.rule === "shape-or-prototype-mutation")
                .map(value => value.message)
        ).toEqual([
            "Reflect.defineProperty can invalidate hidden-class or prototype-chain assumptions."
        ]);
        expect(
            reflectShadow.findings
                .filter(value => value.rule === "shape-or-prototype-mutation")
                .map(value => value.message)
        ).toEqual([
            "Object.setPrototypeOf can invalidate hidden-class or prototype-chain assumptions."
        ]);
    });

    test("distinguishes late receiver fields from constructors, declarations, and foreign writes", async () => {
        const report = await analyze(
            [
                "export class Declared {",
                "  field = 1;",
                "  optional?: number;",
                "  constructor() { this.ready = 1; }",
                "  update(other) {",
                "    let local = 0;",
                "    local = 1;",
                "    other.foreign = 2;",
                "    this.field = 3;",
                "    this.optional = 4;",
                "    this.ready = 5;",
                "    this.late = 6;",
                "  }",
                "}",
                "export const Expression = class Expression {",
                "  expressionField = 1;",
                "  constructor() { this.expressionReady = 2; }",
                "  update(other) { other.value = 1; this.expressionField = 2; this.expressionReady = 3; this.expressionLate = 4; }",
                "};",
                "export function ordinary(other) { other.value = 1; }"
            ].join("\n")
        );
        const findings = report.findings.filter(
            value => value.rule === "late-instance-property-write"
        );

        expect(findings).toHaveLength(2);
        expect(
            findings.map(({ severity, message, suggestion, sourceLine }) => ({
                severity,
                message,
                suggestion,
                sourceLine: sourceLine.trim()
            }))
        ).toEqual([
            {
                severity: "warning",
                message:
                    "A method writes an instance property outside the constructor; the first write may transition the receiver shape.",
                suggestion:
                    "Initialize the field consistently in the constructor or explicitly test pre- and post-transition instances.",
                sourceLine: "this.late = 6;"
            },
            {
                severity: "warning",
                message:
                    "A method writes an instance property outside the constructor; the first write may transition the receiver shape.",
                suggestion:
                    "Initialize the field consistently in the constructor or explicitly test pre- and post-transition instances.",
                sourceLine: expect.stringContaining("this.expressionLate = 4")
            }
        ]);
    });

    test("collects exact initialized fields for class declarations and expressions", () => {
        const parsed = parsedFile(
            [
                "class Other { other = 1; constructor() { this.foreign = 2; } }",
                "class Target {",
                "  field = 1;",
                "  ['literal'] = 2;",
                "  constructor() {",
                "    this.ready = 1;",
                "    this['computed'] = 2;",
                "    this[dynamic] = 3;",
                "    other.foreign = 4;",
                "    let local = 0; local = 1;",
                "  }",
                "  update() { this.late = 1; }",
                "}",
                "const Expression = class Expression { expressionField = 1; constructor() { this.expressionReady = 2; } };"
            ].join("\n")
        );

        expect([...initializedClassProperties()]).toEqual([]);
        expect(
            [
                ...initializedClassProperties(classNamed(parsed, "Target"))
            ].toSorted()
        ).toEqual(["computed", "field", "literal", "ready"]);
        expect(
            [
                ...initializedClassProperties(classNamed(parsed, "Expression"))
            ].toSorted()
        ).toEqual(["expressionField", "expressionReady"]);
        expect(
            [
                ...initializedClassProperties(classNamed(parsed, "Other"))
            ].toSorted()
        ).toEqual(["foreign", "other"]);
    });

    test("returns no initialized fields without a class identity", () => {
        expect(initializedClassProperties()).toEqual(new Set());
    });

    test("rejects a malformed class body instead of inventing initialized fields", () => {
        const malformed = synthetic("ClassDeclaration", {
            body: synthetic("ClassBody", { body: {} })
        });

        expect(initializedClassProperties(malformed)).toEqual(new Set());
    });

    test("prunes a matched class before visiting nested same-name classes", () => {
        const parsed = parsedFile(
            "class Target { field = 1; static Nested = class Target { hidden = 2; }; }"
        );

        expect(
            initializedClassProperties(classNamed(parsed, "Target"))
        ).toEqual(new Set(["field"]));
    });

    test("requires exact class-element and constructor assignment shapes", () => {
        const fakeThisMember = synthetic("MemberExpression", {
            object: synthetic("ThisExpression"),
            property: synthetic("Identifier", { name: "fake" })
        });
        const fakeAssignment = synthetic("AssignmentExpression", {
            left: fakeThisMember
        });
        const body = synthetic("ClassBody", {
            body: [
                null,
                synthetic("PropertyDefinition", { key: null }),
                synthetic("PropertyDefinition", {
                    key: synthetic("Identifier", { name: "field" })
                }),
                synthetic("Literal", {
                    kind: "constructor",
                    key: synthetic("Identifier", { name: "constructor" }),
                    value: synthetic("FunctionExpression", {
                        body: synthetic("BlockStatement", {
                            body: [fakeAssignment]
                        })
                    })
                }),
                synthetic("MethodDefinition", {
                    kind: "method",
                    key: synthetic("Identifier", { name: "ordinary" }),
                    value: synthetic("FunctionExpression", {
                        body: synthetic("BlockStatement", {
                            body: [fakeAssignment]
                        })
                    })
                }),
                synthetic("MethodDefinition", {
                    kind: "constructor",
                    key: synthetic("Identifier", { name: "other" }),
                    value: synthetic("FunctionExpression", {
                        body: synthetic("BlockStatement", {
                            body: [
                                synthetic("Literal", { left: fakeThisMember }),
                                synthetic("AssignmentExpression", {
                                    left: synthetic("Literal", {
                                        object: synthetic("ThisExpression"),
                                        property: synthetic("Identifier", {
                                            name: "lookalike"
                                        })
                                    })
                                }),
                                synthetic("AssignmentExpression", {
                                    left: fakeThisMember
                                })
                            ]
                        })
                    })
                }),
                synthetic("MethodDefinition", {
                    kind: "method",
                    key: synthetic("Identifier", { name: "constructor" }),
                    value: synthetic("FunctionExpression", {
                        body: synthetic("BlockStatement", {
                            body: [
                                synthetic("AssignmentExpression", {
                                    left: synthetic("MemberExpression", {
                                        object: synthetic("ThisExpression"),
                                        property: synthetic("Identifier", {
                                            name: "byKey"
                                        })
                                    })
                                })
                            ]
                        })
                    })
                })
            ]
        });
        const malformed = {
            ...parsedFile(""),
            program: synthetic("Program", {
                body: [
                    synthetic("ClassDeclaration", {
                        id: synthetic("Identifier", { name: "Target" }),
                        body
                    })
                ]
            }) as never
        };

        expect(
            initializedClassProperties(classNamed(malformed, "Target"))
        ).toEqual(new Set(["field", "fake", "byKey"]));
    });

    test("requires a non-constructor method writing an uninitialized this field", () => {
        const property = {
            type: "Identifier",
            start: 5,
            end: 9,
            name: "late"
        } satisfies AstNode;
        const thisMember = {
            type: "MemberExpression",
            start: 0,
            end: 9,
            object: { type: "ThisExpression", start: 0, end: 4 },
            property,
            computed: false
        } satisfies AstNode;
        const assignment = {
            type: "AssignmentExpression",
            start: 0,
            end: 13,
            left: thisMember,
            right: { type: "Literal", start: 12, end: 13, value: 1 }
        } satisfies AstNode;
        const calls: Parameters<AddFinding>[] = [];
        const addFinding: AddFinding = (...arguments_) =>
            calls.push(arguments_);

        detectShapeMutation(
            assignment,
            methodCandidate(assignment),
            new Set(),
            new Set(),
            addFinding
        );
        expect(calls).toHaveLength(1);
        expect(calls[0]?.slice(0, 4)).toEqual([
            "late-instance-property-write",
            "warning",
            "A method writes an instance property outside the constructor; the first write may transition the receiver shape.",
            "Initialize the field consistently in the constructor or explicitly test pre- and post-transition instances."
        ]);

        for (const [node, candidate, initialized] of [
            [
                assignment,
                methodCandidate(assignment, "constructor"),
                new Set<string>()
            ],
            [
                assignment,
                methodCandidate(assignment, "update", "function"),
                new Set<string>()
            ],
            [assignment, methodCandidate(assignment), new Set(["late"])],
            [
                { ...assignment, type: "Literal" },
                methodCandidate(assignment),
                new Set<string>()
            ],
            [
                {
                    ...assignment,
                    left: {
                        ...thisMember,
                        object: {
                            type: "IdentifierReference",
                            start: 0,
                            end: 5,
                            name: "other"
                        }
                    }
                },
                methodCandidate(assignment),
                new Set<string>()
            ],
            [
                { ...assignment, left: property },
                methodCandidate(assignment),
                new Set<string>()
            ]
        ] as const) {
            const negativeCalls: Parameters<AddFinding>[] = [];
            detectShapeMutation(
                node,
                candidate,
                new Set(),
                initialized,
                (...arguments_) => negativeCalls.push(arguments_)
            );
            expect(negativeCalls).toEqual([]);
        }
    });

    test("does not detect shape operations on call/assignment lookalikes", () => {
        const object = synthetic("Identifier", { name: "Object" });
        const defineProperty = synthetic("Identifier", {
            name: "defineProperty"
        });
        const fakeMember = synthetic("MemberExpression", {
            object,
            property: defineProperty,
            computed: false
        });
        const fakeThisMember = synthetic("Literal", {
            object: synthetic("ThisExpression"),
            property: synthetic("Identifier", { name: "late" })
        });
        const calls: Parameters<AddFinding>[] = [];
        const addFinding: AddFinding = (...arguments_) =>
            calls.push(arguments_);

        detectShapeMutation(
            synthetic("Literal", { callee: fakeMember }),
            methodCandidate(synthetic("Literal")),
            new Set(),
            new Set(),
            addFinding
        );
        detectShapeMutation(
            synthetic("AssignmentExpression", { left: fakeThisMember }),
            methodCandidate(synthetic("AssignmentExpression")),
            new Set(),
            new Set(),
            addFinding
        );

        expect(calls).toEqual([]);
    });
});
