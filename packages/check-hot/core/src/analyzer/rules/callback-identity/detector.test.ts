import { describe, expect, test, vi } from "vitest";

import { isNode } from "../../ast.js";
import type { AstNode } from "../../ast.js";
import { analyzerFixture } from "../test-fixture.test-utils.js";
import { detectCallbackCall, detectCallbackFlow } from "./detector.js";
import { callbackIdentityExperiment } from "./experiment.js";

const analyze = analyzerFixture("callback");
const doubleValue = (value: number) => value * 2;
const synthetic = (type: string, properties: Record<string, unknown> = {}) =>
    ({ type, start: 1, end: 2, ...properties }) as AstNode;
const callbackNode = synthetic("IdentifierReference", { name: "callback" });
const callbackFlow = { name: "callback", index: 0, path: [] };
const resolveCallback = (value: unknown) =>
    isNode(value) && value.name === "callback" ? callbackFlow : undefined;

describe("callback identity detector", () => {
    test("creates stable distinct wrapper identities with equal behavior", () => {
        const callbacks = callbackIdentityExperiment.variants.map(
            (_, index) =>
                callbackIdentityExperiment.mutate(
                    doubleValue,
                    index
                ) as CallableFunction
        );

        expect(new Set(callbacks).size).toBe(callbacks.length);
        expect(callbacks.map(callback => callback(3))).toEqual([6, 6, 6, 6, 6]);
    });

    test("does not attribute a nested closure call-site to its outer target", async () => {
        const report = await analyze(
            "export function map(values, callback) { return values.map(value => callback(value)); }"
        );

        expect(
            report.findings.find(
                value => value.rule === "callback-parameter-call"
            )
        ).toBeUndefined();
        expect(
            report.obligations.find(
                value => value.mutationFamily === "callback-identity"
            )
        ).toBeUndefined();
    });

    test("links a callback passed to a known collection method", async () => {
        const report = await analyze(
            "export function map(values, callback) { return values.map(callback); }"
        );

        expect(
            report.findings.find(
                value => value.rule === "callback-parameter-flow"
            )?.parameterIndex
        ).toBe(1);
    });

    test("keeps a closure-owned alias out of the outer optimization proof", async () => {
        const report = await analyze(
            "export function invoke(callback) { const alias = callback; return [1].map(() => alias()); }"
        );

        expect(
            report.findings.find(
                value => value.rule === "callback-parameter-call"
            )
        ).toBeUndefined();
    });

    test("emits one exact obligation per direct call site", async () => {
        const report = await analyze(
            "export function invoke(callback) { callback(1); return callback(2); }"
        );
        const findings = report.findings.filter(
            value => value.rule === "callback-parameter-call"
        );

        expect(findings).toHaveLength(2);
        expect(new Set(findings.map(finding => finding.start)).size).toBe(2);
        expect(
            report.obligations.filter(
                obligation => obligation.mutationFamily === "callback-identity"
            )
        ).toHaveLength(2);
    });

    test("reports the complete direct callback-call contract", async () => {
        const report = await analyze(
            "export function invoke(callback) { return (callback)(1); }"
        );
        const finding = report.findings.find(
            value => value.rule === "callback-parameter-call"
        );

        expect(finding).toMatchObject({
            severity: "warning",
            message:
                "Parameter callback is invoked as a callback, so function identity diversity is an observable call-site input.",
            suggestion:
                "Train stable, polymorphic, and megamorphic callback families in both warmup and guarded stress.",
            parameterIndex: 0,
            sourceLine:
                "export function invoke(callback) { return (callback)(1); }"
        });
    });

    test("recognizes every supported collection callback method", async () => {
        const methods = [
            "every",
            "filter",
            "find",
            "findIndex",
            "flatMap",
            "forEach",
            "map",
            "reduce",
            "reduceRight",
            "some",
            "sort"
        ];
        const report = await analyze(
            [
                "export function consume(values, callback) {",
                ...methods.map(method => `  values.${method}(callback);`),
                "}"
            ].join("\n")
        );
        const findings = report.findings.filter(
            value => value.rule === "callback-parameter-flow"
        );

        expect(findings).toHaveLength(methods.length);
        expect(
            findings.map(
                ({
                    severity,
                    message,
                    suggestion,
                    parameterIndex,
                    sourceLine
                }) => ({
                    severity,
                    message,
                    suggestion,
                    parameterIndex,
                    sourceLine: sourceLine.trim()
                })
            )
        ).toEqual(
            methods.map(method => ({
                severity: "warning",
                message: `Parameter callback flows into ${method} as a callback identity input.`,
                suggestion:
                    "Train stable, polymorphic, and megamorphic callback families after a stable warmup.",
                parameterIndex: 1,
                sourceLine: `values.${method}(callback);`
            }))
        );
    });

    test("rejects callback-shaped calls without a proven parameter flow", async () => {
        const report = await analyze(
            [
                "const local = value => value;",
                "export function ignore(values, callback) {",
                "  factory(callback);",
                "  values.unknown(callback);",
                "  values.map(local);",
                "  callback.call(null, 1);",
                "  return callback;",
                "}"
            ].join("\n")
        );

        expect(
            report.findings.filter(value =>
                value.rule.startsWith("callback-parameter-")
            )
        ).toEqual([]);
    });

    test("direct-call primitive rejects wrong node, duplicate, and wrong callee shapes", () => {
        const addFinding = vi.fn();
        const reported = new Set<number>();
        const call = synthetic("CallExpression", { callee: callbackNode });

        detectCallbackCall(
            synthetic("Literal", { callee: callbackNode }),
            resolveCallback,
            reported,
            addFinding
        );
        detectCallbackCall(
            synthetic("CallExpression", { callee: null }),
            resolveCallback,
            reported,
            addFinding
        );
        detectCallbackCall(
            synthetic("CallExpression", {
                callee: synthetic("MemberExpression")
            }),
            resolveCallback,
            reported,
            addFinding
        );
        detectCallbackCall(
            synthetic("CallExpression", {
                callee: synthetic("Literal", { value: "callback" })
            }),
            resolveCallback,
            reported,
            addFinding
        );
        reported.add(call.start);
        detectCallbackCall(call, resolveCallback, reported, addFinding);

        expect(addFinding).not.toHaveBeenCalled();
    });

    test("direct-call primitive accepts both identifier node kinds exactly once", () => {
        const addFinding = vi.fn();
        const reported = new Set<number>();
        for (const type of ["Identifier", "IdentifierReference"]) {
            const callee = synthetic(type, { name: "callback" });
            const call = synthetic("CallExpression", {
                start: reported.size + 10,
                callee
            });
            detectCallbackCall(call, resolveCallback, reported, addFinding);
        }

        expect(addFinding).toHaveBeenCalledTimes(2);
        expect(reported).toEqual(new Set([10, 11]));
    });

    test("method-flow primitive rejects every malformed call boundary", () => {
        const addFinding = vi.fn();
        const reported = new Set<number>();
        const member = synthetic("MemberExpression", {
            object: synthetic("IdentifierReference", { name: "values" }),
            property: synthetic("Identifier", { name: "map" }),
            computed: false
        });
        const malformed = [
            synthetic("Literal", {
                callee: member,
                arguments: [callbackNode]
            }),
            synthetic("CallExpression", {
                callee: null,
                arguments: [callbackNode]
            }),
            synthetic("CallExpression", {
                callee: callbackNode,
                arguments: [callbackNode]
            }),
            synthetic("CallExpression", {
                callee: synthetic("MemberExpression", {
                    property: synthetic("Identifier", { name: "unknown" })
                }),
                arguments: [callbackNode]
            }),
            synthetic("CallExpression", {
                callee: member,
                arguments: "not-an-array"
            })
        ];
        for (const node of malformed) {
            detectCallbackFlow(node, resolveCallback, reported, addFinding);
        }
        const duplicate = synthetic("CallExpression", {
            start: 50,
            callee: member,
            arguments: [callbackNode]
        });
        reported.add(50);
        detectCallbackFlow(duplicate, resolveCallback, reported, addFinding);

        expect(addFinding).not.toHaveBeenCalled();
    });

    test("method-flow primitive skips non-node arguments before a proven callback", () => {
        const addFinding = vi.fn();
        const member = synthetic("MemberExpression", {
            property: synthetic("Literal", { value: "map" }),
            computed: true
        });
        const resolve = vi.fn((value: unknown) =>
            value === callbackNode ? callbackFlow : undefined
        );

        detectCallbackFlow(
            synthetic("CallExpression", {
                callee: member,
                arguments: [null, callbackNode]
            }),
            resolve,
            new Set(),
            addFinding
        );

        expect(resolve).toHaveBeenCalledTimes(1);
        expect(resolve).toHaveBeenCalledWith(callbackNode);
        expect(addFinding).toHaveBeenCalledTimes(1);
    });
});
