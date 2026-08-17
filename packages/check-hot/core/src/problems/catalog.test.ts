import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { analyzerProblemDefinitions } from "../analyzer/rules/catalog.js";
import { getProblemDefinition, problemDefinitions } from "./catalog.js";

describe("problem catalog", () => {
    test("indexes every analyzer rule through the same stable ID", () => {
        for (const definition of analyzerProblemDefinitions) {
            expect(getProblemDefinition(definition.id)).toBe(definition);
        }
    });

    test("contains unique, documented feature-owned definitions", async () => {
        expect(
            new Set(problemDefinitions.map(problem => problem.id)).size
        ).toBe(problemDefinitions.length);
        await Promise.all(
            problemDefinitions.map(async problem => {
                expect(problem.title.length).toBeGreaterThan(0);
                expect(problem.feature.length).toBeGreaterThan(0);
                expect(problem.likelyCauses[0]?.length).toBeGreaterThan(20);
                expect(problem.confirmWith[0]?.length).toBeGreaterThan(20);
                expect(problem.remediations[0]?.action.length).toBeGreaterThan(
                    20
                );
                expect(problem.remediations[0]?.when.length).toBeGreaterThan(
                    20
                );
                expect(problem.remediations[0]?.action).not.toMatch(
                    /^Resolve the documented/u
                );
                const documentation = await readFile(
                    resolve(
                        import.meta.dirname,
                        "../..",
                        problem.documentation
                    ),
                    "utf8"
                );
                expect(documentation).toContain("## ");
                expect(documentation).toContain("```");
            })
        );
    });
});
