import { describe, expect, test } from "vitest";

import type { AstNode } from "../../ast.js";
import type { AddFinding } from "../shared.js";
import { analyzerFixture } from "../test-fixture.test-utils.js";
import { detectPropertyDeletion } from "./detector.js";

const analyze = analyzerFixture("delete");

describe("property deletion detector", () => {
    test("distinguishes an array hole from object deletion", async () => {
        const report = await analyze(
            "export function hot(flag, object) { const array = [1, 2]; if (flag) delete array[1]; else delete object.value; return array; }"
        );
        const rules = report.findings.map(finding => finding.rule);

        expect(rules).toContain("holey-array-operation");
        expect(rules).toContain("delete-property");
    });

    test("reports complete array-hole and object-shape contracts", async () => {
        const report = await analyze(
            [
                "export function hot(object, parameter, index) {",
                "  const array = [1, 2];",
                "  delete array[1];",
                "  delete object.value;",
                "  delete parameter[0];",
                "  delete array[index];",
                "  void array[0];",
                "}"
            ].join("\n")
        );
        const findings = report.findings.filter(finding =>
            ["holey-array-operation", "delete-property"].includes(finding.rule)
        );

        expect(findings).toHaveLength(4);
        expect(findings[0]).toMatchObject({
            rule: "holey-array-operation",
            severity: "critical",
            message:
                "Deleting an index from a locally created array makes its elements holey.",
            suggestion:
                "Keep packed and holey behavior in separate scenarios and verify the array elements kind dynamically.",
            sourceLine: "  delete array[1];"
        });
        for (const finding of findings.slice(1)) {
            expect(finding).toMatchObject({
                rule: "delete-property",
                severity: "critical",
                message:
                    "Deleting an object property can move objects to dictionary storage and invalidate optimized shape assumptions.",
                suggestion:
                    "Prefer stable object shapes (for example assign undefined) when this object participates in a hot path, and verify maps dynamically."
            });
        }
    });

    test("requires an actual unary delete and a member argument for array holes", () => {
        const calls: Parameters<AddFinding>[] = [];
        const addFinding: AddFinding = (...arguments_) => {
            calls.push(arguments_);
        };
        const member = {
            type: "MemberExpression",
            start: 1,
            end: 9,
            object: { type: "Identifier", start: 1, end: 6, name: "array" },
            property: { type: "Literal", start: 7, end: 8, value: 0 }
        } satisfies AstNode;

        detectPropertyDeletion(
            {
                type: "Literal",
                start: 0,
                end: 9,
                operator: "delete",
                argument: member
            },
            new Set(["array"]),
            addFinding
        );
        expect(calls).toEqual([]);

        detectPropertyDeletion(
            {
                type: "UnaryExpression",
                start: 0,
                end: 8,
                operator: "delete",
                argument: {
                    type: "IdentifierReference",
                    start: 7,
                    end: 8,
                    name: "array"
                }
            },
            new Set(["array"]),
            addFinding
        );
        expect(calls).toHaveLength(1);
        expect(calls[0]?.[0]).toBe("delete-property");
    });
});
