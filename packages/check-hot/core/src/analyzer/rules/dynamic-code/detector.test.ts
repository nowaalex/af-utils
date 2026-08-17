import { describe, expect, test } from "vitest";

import type { AstNode } from "../../ast.js";
import type { AddFinding } from "../shared.js";
import { analyzerFixture } from "../test-fixture.test-utils.js";
import { detectDynamicCode } from "./detector.js";

const analyze = analyzerFixture("dynamic-code");

describe("dynamic code detector", () => {
    test("reports direct eval but respects a shadowed binding", async () => {
        const report = await analyze(
            "export function direct(source) { return eval(source); } export function shadowed(eval) { return eval('1'); }"
        );

        expect(
            report.candidates
                .find(candidate => candidate.name === "direct")
                ?.findings.map(finding => finding.rule)
        ).toContain("dynamic-eval");
        expect(
            report.candidates
                .find(candidate => candidate.name === "shadowed")
                ?.findings.map(finding => finding.rule)
        ).not.toContain("dynamic-eval");
    });

    test("reports the complete direct-eval contract only for calls", async () => {
        const report = await analyze(
            [
                "export function direct(source) { return eval(source); }",
                "export function reference() { return eval; }",
                "export function other() { return evaluate('1'); }",
                "export function member(object) { return object.eval('1'); }",
                "export function construct() { return new eval(); }"
            ].join("\n")
        );
        const findings = report.findings.filter(
            finding => finding.rule === "dynamic-eval"
        );

        expect(findings).toHaveLength(1);
        expect(findings[0]).toMatchObject({
            severity: "critical",
            message:
                "Direct eval limits optimization and makes static reasoning incomplete.",
            suggestion:
                "Keep evaluated code outside hot functions and cover this path with an explicit scenario if it cannot be removed.",
            sourceLine:
                "export function direct(source) { return eval(source); }"
        });
    });

    test("does not classify a non-call AST node with an eval callee", () => {
        const calls: Parameters<AddFinding>[] = [];
        detectDynamicCode(
            {
                type: "NewExpression",
                start: 0,
                end: 10,
                callee: {
                    type: "IdentifierReference",
                    start: 4,
                    end: 8,
                    name: "eval"
                } satisfies AstNode,
                arguments: []
            },
            new Set(),
            (...arguments_) => calls.push(arguments_)
        );

        expect(calls).toEqual([]);
    });
});
