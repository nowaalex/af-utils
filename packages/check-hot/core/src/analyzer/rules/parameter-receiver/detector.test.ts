import { describe, expect, test, vi } from "vitest";

import { isNode } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import { analyzerFixture } from "../test-fixture.test-utils.js";
import { detectParameterReceiver } from "./detector.js";

const analyze = analyzerFixture("receiver");
const synthetic = (type: string, properties: Record<string, unknown> = {}) =>
    ({ type, start: 0, end: 1, ...properties }) as AstNode;
const receiver = synthetic("IdentifierReference", { name: "receiver" });
const resolveReceiver = (value: unknown) =>
    isNode(value) && value.name === "receiver"
        ? { name: "receiver", index: 0, path: [] }
        : undefined;
const detectedRule = (node: AstNode) => {
    const addFinding = vi.fn();
    detectParameterReceiver(node, resolveReceiver, addFinding);
    return addFinding.mock.calls[0]?.[0] as string | undefined;
};

describe("parameter receiver detector", () => {
    test("keeps ambiguous length and dynamic keyed reads advisory", async () => {
        const report = await analyze(
            "export function sum(values) { let total = 0; for (let index = 0; index < values.length; index++) total += values[index]; return total; }"
        );

        expect(report.obligations).toEqual([]);
        expect(
            report.findings.find(
                finding => finding.rule === "ambiguous-length-access"
            )
        ).not.toHaveProperty("parameterIndex");
    });

    test("does not add an object-shape obligation beside a proven array index", async () => {
        const report = await analyze(
            "export function head(values) { return values.length ? values[0] : undefined; }"
        );

        expect(report.obligations.map(value => value.mutationFamily)).toEqual([
            "array-elements"
        ]);
        expect(report.findings.map(finding => finding.rule)).toContain(
            "ambiguous-length-access"
        );
    });

    test("links a named property receiver to the exact object argument", async () => {
        const report = await analyze(
            "export function read(object) { return object.value; }"
        );

        expect(
            report.obligations.find(
                value => value.mutationFamily === "object-shape"
            )
        ).toMatchObject({ exportName: "read", parameterIndex: 0 });
    });

    test("reports complete advisory contracts for ambiguous keys and length", async () => {
        const report = await analyze(
            "export function read(receiver, key) { return receiver[key] ?? receiver.length; }"
        );

        expect(
            report.findings
                .filter(finding => finding.rule.startsWith("ambiguous-"))
                .map(
                    ({
                        rule,
                        severity,
                        message,
                        suggestion,
                        parameterIndex
                    }) => ({
                        rule,
                        severity,
                        message,
                        suggestion,
                        parameterIndex
                    })
                )
        ).toEqual([
            {
                rule: "ambiguous-keyed-receiver",
                severity: "info",
                message:
                    "A function parameter is used as a dynamically keyed receiver, but the access does not prove whether it is an array, string, object, or collection-like value.",
                suggestion:
                    "Keep this as advisory evidence until the receiver or key has a separately proven mutation role.",
                parameterIndex: undefined
            },
            {
                rule: "ambiguous-length-access",
                severity: "info",
                message:
                    "A function parameter is read through .length, but this access alone does not prove whether the receiver is an array, string, or ordinary object.",
                suggestion:
                    "Keep this as advisory evidence until another operation proves a safe receiver-specific mutation plan.",
                parameterIndex: undefined
            }
        ]);
    });

    test("classifies numeric indexes and every array-like method as array elements", async () => {
        const methods = [
            "at",
            "concat",
            "entries",
            "every",
            "filter",
            "find",
            "findIndex",
            "flat",
            "flatMap",
            "forEach",
            "includes",
            "indexOf",
            "join",
            "keys",
            "map",
            "pop",
            "push",
            "reduce",
            "reduceRight",
            "reverse",
            "shift",
            "slice",
            "some",
            "sort",
            "splice",
            "unshift",
            "values"
        ];
        const report = await analyze(
            [
                "export function read(receiver) {",
                "  void receiver[0];",
                ...methods.map(method => `  void receiver.${method};`),
                "}"
            ].join("\n")
        );
        const findings = report.findings.filter(
            finding => finding.rule === "parameter-indexed-access"
        );

        expect(findings).toHaveLength(methods.length + 1);
        expect(
            findings.map(
                ({ severity, message, suggestion, parameterIndex }) => ({
                    severity,
                    message,
                    suggestion,
                    parameterIndex
                })
            )
        ).toEqual(
            Array.from({ length: methods.length + 1 }, () => ({
                severity: "warning",
                message:
                    "A function parameter is used as an indexed/array-like receiver, so elements kind and packedness are hot-path inputs.",
                suggestion:
                    "Exercise packed SMI, double, object, holey, and dictionary arrays after a stable warmup.",
                parameterIndex: 0
            }))
        );
    });

    test("keeps computed string and ordinary named properties on object shapes", async () => {
        const report = await analyze(
            [
                "export function read(receiver) {",
                "  void receiver.value;",
                "  void receiver['value'];",
                "  void receiver['length'];",
                "}"
            ].join("\n")
        );
        const findings = report.findings.filter(
            finding => finding.rule === "parameter-property-access"
        );

        expect(findings).toHaveLength(3);
        expect(findings[0]).toMatchObject({
            severity: "warning",
            message:
                "A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.",
            suggestion:
                "Exercise stable, reordered, extra, and missing-field shapes after a stable warmup.",
            parameterIndex: 0
        });
        expect(
            report.findings.filter(
                finding => finding.rule === "ambiguous-length-access"
            )
        ).toEqual([]);
    });

    test("ignores member access whose receiver is not a proven parameter", async () => {
        const report = await analyze(
            "export function read() { const local = { value: 1 }; return local.value; }"
        );

        expect(
            report.findings.filter(finding =>
                finding.rule.startsWith("parameter-")
            )
        ).toEqual([]);
    });

    test("primitive requires an exact member with a node receiver", () => {
        expect(
            detectedRule(
                synthetic("Literal", {
                    object: receiver,
                    property: synthetic("Identifier", { name: "value" }),
                    computed: false
                })
            )
        ).toBeUndefined();
        expect(
            detectedRule(
                synthetic("MemberExpression", {
                    object: null,
                    property: synthetic("Identifier", { name: "value" }),
                    computed: false
                })
            )
        ).toBeUndefined();
    });

    test("requires computed syntax before classifying a missing key as dynamic", () => {
        expect(
            detectedRule(
                synthetic("MemberExpression", {
                    object: receiver,
                    property: null,
                    computed: false
                })
            )
        ).toBe("parameter-property-access");
        expect(
            detectedRule(
                synthetic("MemberExpression", {
                    object: receiver,
                    property: null,
                    computed: true
                })
            )
        ).toBe("ambiguous-keyed-receiver");
    });

    test.each([
        {
            label: "computed numeric literal",
            computed: true,
            property: synthetic("Literal", { value: 0 }),
            rule: "parameter-indexed-access"
        },
        {
            label: "non-computed numeric literal",
            computed: false,
            property: synthetic("Literal", { value: 0 }),
            rule: "parameter-property-access"
        },
        {
            label: "computed numeric-looking string",
            computed: true,
            property: synthetic("Literal", { value: "0" }),
            rule: "parameter-property-access"
        },
        {
            label: "plain array-like method",
            computed: false,
            property: synthetic("Identifier", { name: "map" }),
            rule: "parameter-indexed-access"
        },
        {
            label: "computed array-like method string",
            computed: true,
            property: synthetic("Literal", { value: "map" }),
            rule: "parameter-property-access"
        }
    ])("classifies $label exactly", ({ computed, property, rule }) => {
        expect(
            detectedRule(
                synthetic("MemberExpression", {
                    object: receiver,
                    property,
                    computed
                })
            )
        ).toBe(rule);
    });
});
