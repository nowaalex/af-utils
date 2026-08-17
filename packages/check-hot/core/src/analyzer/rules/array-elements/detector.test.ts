import { parseSync } from "oxc-parser";
import { describe, expect, test, vi } from "vitest";

import { walk } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import type { CandidateNode, ParsedFile } from "../../internal-model.js";
import { analyzerFixture } from "../test-fixture.test-utils.js";
import { concreteValueKind } from "../value-kinds.js";
import {
    collectKnownArrays,
    detectArrayElements,
    finishArrayElements
} from "./detector.js";
import type { ArrayElementsState } from "./detector.js";
import { arrayElementsExperiment } from "./experiment.js";

const analyze = analyzerFixture("arrays");
const synthetic = (type: string, properties: Record<string, unknown> = {}) =>
    ({ type, start: 0, end: 1, ...properties }) as AstNode;
const parsed = { source: "array.push(value)" } as ParsedFile;
const emptyState = (): ArrayElementsState => ({ pushKinds: new Map() });

describe("array elements detector", () => {
    test("normalizes only concrete representation kinds", () => {
        expect(concreteValueKind("TemplateLiteral")).toBe("string");
        expect(concreteValueKind("number")).toBe("number");
        expect(concreteValueKind("IdentifierReference")).toBeUndefined();
    });

    test("constructs every registered elements family", () => {
        const values = arrayElementsExperiment.variants.map(
            (_, index) =>
                arrayElementsExperiment.mutate([1, 2, 3], index) as unknown[]
        );

        expect(values[0]).toEqual([1, 2, 3]);
        expect(values[1]).toEqual([0.25, 1.25, 2.25]);
        expect(typeof values[2][0]).toBe("object");
        expect(Object.hasOwn(values[3], 1)).toBe(false);
        expect(values[4].length).toBeGreaterThan(100_000);
    });

    test("preserves the exact packed, object, holey, and sparse variant contracts", () => {
        const seed = [10, 20, 30, 40, 50];
        const variants = arrayElementsExperiment.variants.map(
            (_, index) =>
                arrayElementsExperiment.mutate(seed, index) as unknown[]
        );

        expect(variants[0]).toEqual([1, 2, 3, 4, 5]);
        expect(variants[1]).toEqual([0.25, 1.25, 2.25, 3.25, 4.25]);
        expect(variants[2]).toEqual([
            { value: 10 },
            { value: 20 },
            { value: 30 },
            { value: 40 },
            { value: 50 }
        ]);
        expect(variants[3]).toHaveLength(5);
        expect(Reflect.ownKeys(variants[3])).toEqual([
            "0",
            "1",
            "3",
            "4",
            "length"
        ]);

        const longSeed = Array.from({ length: 30_000 }, (_, index) => index);
        const sparse = arrayElementsExperiment.mutate(longSeed, 4) as unknown[];
        expect(Reflect.ownKeys(sparse)).toEqual(["120000", "length"]);
        expect(sparse[120_000]).toBe(0);
    });

    test("reports the array-elements family when its seed is unsafe", () => {
        expect(() => arrayElementsExperiment.mutate({}, 0)).toThrowError(
            "array-elements requires an ordinary array seed"
        );
    });

    test("classifies a heterogeneous literal without inventing a transition", async () => {
        const report = await analyze(
            "export function hot() { const array = [-2, null, () => {}]; return array; }"
        );
        const finding = report.findings.find(
            value => value.rule === "heterogeneous-array-literal"
        );

        expect(finding?.message).toContain("number, null, function");
        expect(finding?.message).toContain("rather than transitioning later");
    });

    test("does not merge pushes made to different receivers", async () => {
        const report = await analyze(
            "export function hot() { const numbers = []; const objects = []; numbers.push(1); objects.push({ value: 1 }); return [numbers, objects]; }"
        );

        expect(
            report.findings.some(
                value => value.rule === "mixed-array-element-kinds"
            )
        ).toBe(false);
    });

    test("tracks mixed pushes and sparse writes on their exact array", async () => {
        const report = await analyze(
            "export function hot() { const array = []; array.push(1); array.push(1.5); array.push({ value: 1 }); array[1000] = 2; return array; }"
        );
        const rules = report.findings.map(value => value.rule);

        expect(rules).toEqual(
            expect.arrayContaining([
                "mixed-array-element-kinds",
                "sparse-array-write"
            ])
        );
    });

    test("reports the complete heterogeneous-literal contract", async () => {
        const report = await analyze(
            "export function hot() { return [1, 'two', false]; }"
        );
        const finding = report.findings.find(
            value => value.rule === "heterogeneous-array-literal"
        );

        expect(finding).toMatchObject({
            severity: "warning",
            message:
                "A single array literal contains statically different element classes (number, string, boolean); it is created with a generalized elements representation rather than transitioning later.",
            suggestion:
                "Verify whether the heterogeneous representation reaches a hot loop; do not describe this literal as a runtime elements-kind transition.",
            sourceLine: "export function hot() { return [1, 'two', false]; }"
        });
    });

    test("proves heterogeneous literals from two concrete kinds despite unknown elements", async () => {
        const report = await analyze(
            "export function hot(dynamic) { return [dynamic, 1, `value-${dynamic}`]; }"
        );
        const finding = report.findings.find(
            value => value.rule === "heterogeneous-array-literal"
        );

        expect(finding).toMatchObject({
            severity: "warning",
            message: expect.stringContaining("number, string")
        });
    });

    test("ignores homogeneous, holey, and statically unknown literals", async () => {
        const report = await analyze(
            [
                "export function hot(dynamic) {",
                "  const homogeneous = [1, 2, 3];",
                "  const single = [1];",
                "  const holey = [1, , 2];",
                "  const unknown = [1, dynamic];",
                "  return [homogeneous, single, holey, unknown];",
                "}"
            ].join("\n")
        );

        expect(
            report.findings.filter(
                value => value.rule === "heterogeneous-array-literal"
            )
        ).toEqual([]);
    });

    test("reports exact receiver and pushed value domains", async () => {
        const report = await analyze(
            [
                "export function hot(dynamic) {",
                "  const array = [];",
                "  array.push(1);",
                "  array.push('two');",
                "  array.push(dynamic);",
                "  array.notPush({ value: 1 });",
                "  return array;",
                "}"
            ].join("\n")
        );
        const finding = report.findings.find(
            value => value.rule === "mixed-array-element-kinds"
        );

        expect(finding).toMatchObject({
            severity: "warning",
            message:
                "Array receiver array receives statically different pushed value kinds (number, string).",
            suggestion:
                "Use scenarios that verify SMI, double, object, packed, and holey transitions for this exact array receiver.",
            sourceLine: "  array.push(1);"
        });
    });

    test("requires a local array and a numeric sparse-index boundary", async () => {
        const report = await analyze(
            [
                "export function hot(parameter, dynamic) {",
                "  const array = [];",
                "  const object = {};",
                "  array[63] = 1;",
                "  array[64] = 2;",
                "  array['65'] = 3;",
                "  array[dynamic] = 4;",
                "  parameter[1000] = 5;",
                "  object[1000] = 6;",
                "  return array;",
                "}"
            ].join("\n")
        );
        const findings = report.findings.filter(
            value => value.rule === "sparse-array-write"
        );

        expect(findings).toHaveLength(1);
        expect(findings[0]).toMatchObject({
            severity: "warning",
            message:
                "A locally created array is written at static index 64, which may introduce holes or sparse storage if the array has not already grown to that index.",
            suggestion:
                "Exercise the far-index write explicitly and inspect the runtime's packed, holey, and sparse representations.",
            sourceLine: "  array[64] = 2;"
        });
    });

    test("does not borrow arrays declared inside a differently owned closure", async () => {
        const report = await analyze(
            [
                "export function outer() {",
                "  function nested() { const hidden = []; hidden[64] = 1; return hidden; }",
                "  return nested;",
                "}"
            ].join("\n")
        );
        const outer = report.candidates.find(
            candidate => candidate.name === "outer"
        );

        expect(
            outer?.findings.filter(value => value.rule === "sparse-array-write")
        ).toEqual([]);
    });

    test("collects local arrays while pruning nested function bodies", () => {
        const program = parseSync(
            "fixture.js",
            "function hot() { const local = []; function nested() { const hidden = []; } return local; }"
        ).program as unknown as AstNode;
        let declaration: AstNode | undefined;
        walk(program, [], node => {
            if (!declaration && node.type === "FunctionDeclaration") {
                declaration = node;
            }
        });
        const candidate = {
            node: declaration
        } as unknown as CandidateNode;

        expect(collectKnownArrays(candidate)).toEqual(new Set(["local"]));
    });

    test("collect-known-arrays requires an exact named array declarator", () => {
        const candidate = {
            node: synthetic("FunctionDeclaration", {
                body: synthetic("BlockStatement", {
                    body: [
                        synthetic("Literal", {
                            id: synthetic("Identifier", { name: "fake" }),
                            init: synthetic("ArrayExpression", { elements: [] })
                        }),
                        synthetic("VariableDeclarator", {
                            id: null,
                            init: synthetic("ArrayExpression", { elements: [] })
                        }),
                        synthetic("VariableDeclarator", {
                            id: synthetic("Identifier", { name: "notArray" }),
                            init: synthetic("ObjectExpression", {
                                properties: []
                            })
                        })
                    ]
                })
            })
        } as unknown as CandidateNode;

        expect(collectKnownArrays(candidate)).toEqual(new Set());
    });

    test("array literal primitive skips holes and rejects lookalike nodes", () => {
        const addFinding = vi.fn();
        detectArrayElements(
            synthetic("ArrayExpression", {
                elements: [null, synthetic("Literal", { value: 1 })]
            }),
            parsed,
            new Set(),
            emptyState(),
            addFinding
        );
        detectArrayElements(
            synthetic("Literal", {
                elements: [
                    synthetic("Literal", { value: 1 }),
                    synthetic("Literal", { value: "two" })
                ]
            }),
            parsed,
            new Set(),
            emptyState(),
            addFinding
        );

        expect(addFinding).not.toHaveBeenCalled();
    });

    test("push primitive requires an exact call, member, and arguments array", () => {
        const addFinding = vi.fn();
        const state = emptyState();
        const member = synthetic("MemberExpression", {
            object: synthetic("Identifier", {
                start: 0,
                end: 5,
                name: "array"
            }),
            property: synthetic("Identifier", { name: "push" })
        });
        const wrongCalls = [
            synthetic("Literal", {
                callee: member,
                arguments: [synthetic("Literal", { value: 1 })]
            }),
            synthetic("CallExpression", {
                callee: synthetic("Identifier", { name: "push" }),
                arguments: [synthetic("Literal", { value: 1 })]
            })
        ];
        for (const node of wrongCalls) {
            detectArrayElements(node, parsed, new Set(), state, addFinding);
        }
        expect(state.pushKinds).toEqual(new Map());

        expect(() =>
            detectArrayElements(
                synthetic("CallExpression", {
                    callee: member,
                    arguments: {}
                }),
                parsed,
                new Set(),
                state,
                addFinding
            )
        ).not.toThrow();
        expect(state.pushKinds.get("array")?.kinds).toEqual(new Set());
        expect(addFinding).not.toHaveBeenCalled();
    });

    test("sparse-write primitive rejects every lookalike boundary", () => {
        const addFinding = vi.fn();
        const arrayObject = synthetic("Identifier", { name: "array" });
        const sparseProperty = synthetic("Literal", { value: 64 });
        const memberFields = { object: arrayObject, property: sparseProperty };
        const nodes = [
            synthetic("Literal", {
                left: synthetic("MemberExpression", memberFields)
            }),
            synthetic("AssignmentExpression", { left: null }),
            synthetic("AssignmentExpression", {
                left: synthetic("Literal", memberFields)
            }),
            synthetic("AssignmentExpression", {
                left: synthetic("MemberExpression", {
                    object: arrayObject,
                    property: synthetic("Identifier", { value: 64 })
                })
            }),
            synthetic("AssignmentExpression", {
                left: synthetic("MemberExpression", {
                    object: synthetic("Literal"),
                    property: sparseProperty
                })
            })
        ];
        for (const node of nodes) {
            detectArrayElements(
                node,
                parsed,
                new Set(["array"]),
                emptyState(),
                addFinding
            );
        }

        expect(addFinding).not.toHaveBeenCalled();
    });

    test("finish primitive emits only a genuinely mixed receiver", () => {
        const addFinding = vi.fn();
        const node = synthetic("CallExpression");
        const state: ArrayElementsState = {
            pushKinds: new Map([
                ["single", { kinds: new Set(["number"]), node }],
                ["mixed", { kinds: new Set(["number", "object"]), node }]
            ])
        };

        finishArrayElements(state, addFinding);

        expect(addFinding).toHaveBeenCalledTimes(1);
        expect(addFinding).toHaveBeenCalledWith(
            "mixed-array-element-kinds",
            "warning",
            "Array receiver mixed receives statically different pushed value kinds (number, object).",
            "Use scenarios that verify SMI, double, object, packed, and holey transitions for this exact array receiver.",
            node
        );
    });
});
