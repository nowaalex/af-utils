import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

const readJson = async (name: string) =>
    JSON.parse(
        await readFile(new URL(name, import.meta.url), "utf8")
    ) as Record<string, unknown>;

describe("checked-in Three.js audit", () => {
    test("keeps the heavy root scan honest and actionable", async () => {
        const analysis = await readJson("root-analysis.summary.json");
        const metrics = analysis.metrics as Record<string, number>;
        const graph = analysis.graph as {
            complete: boolean;
            diagnostics: string[];
        };
        const rules = analysis.ruleCounts as Record<string, number>;
        const candidates = analysis.topCandidates as {
            path: string;
            findings: unknown[];
        }[];

        expect(metrics.files).toBeGreaterThan(500);
        expect(metrics.candidates).toBeGreaterThan(1_000);
        expect(metrics.findings).toBeGreaterThan(5_000);
        expect(metrics.obligations).toBeGreaterThan(100);
        expect(graph.complete).toBe(false);
        expect(
            graph.diagnostics.some(
                diagnostic =>
                    diagnostic.includes("nonliteral dynamic import") ||
                    diagnostic.includes("https://")
            )
        ).toBe(true);
        expect(
            graph.diagnostics.filter(diagnostic =>
                /(?:README|\.(?:css|json|wasm|ttf|woff2?)(?:\b|$))/iu.test(
                    diagnostic
                )
            )
        ).toEqual([]);
        expect(rules["parameter-property-access"]).toBeGreaterThan(0);
        expect(rules["dynamic-keyed-access-in-loop"]).toBeGreaterThan(0);
        expect(candidates.length).toBeGreaterThanOrEqual(10);
        expect(
            candidates.every(candidate => candidate.path.startsWith("src/"))
        ).toBe(true);
        expect(
            candidates.some(candidate => candidate.findings.length > 0)
        ).toBe(true);
    });

    test("keeps runtime advice behind exact target and semantic evidence", async () => {
        const runtime = await readJson("runtime-summary.json");
        const targets = runtime.targets as {
            id: string;
            optimized: boolean;
            requestedTier: string;
            activeTier: string;
        }[];
        const statuses = runtime.selectedStatuses as Record<string, number>;
        const accepted = runtime.acceptedVariants as string[];
        const excluded = runtime.excludedVariants as { variant: string }[];

        expect(runtime.passed).toBe(true);
        expect(runtime.coverageComplete).toBe(true);
        expect(runtime.targetDeoptimizations).toBe(0);
        expect(runtime.problems).toEqual([]);
        expect(statuses).toEqual({ passed: 4 });
        expect(targets).toEqual([
            expect.objectContaining({
                id: "lerp",
                optimized: true,
                requestedTier: "turbofan",
                activeTier: "turbofan"
            })
        ]);
        expect(accepted).toEqual(
            expect.arrayContaining([
                "seed-number",
                "fractional-double",
                "negative-zero"
            ])
        );
        expect(excluded.map(item => item.variant)).toEqual(
            expect.arrayContaining(["nan", "int32-overflow", "uint32-overflow"])
        );
    });

    test("states proof boundaries in the human report", async () => {
        const report = await readFile(
            new URL("REPORT.md", import.meta.url),
            "utf8"
        );

        expect(report).toContain("AST-ranked hypotheses");
        expect(report).toContain("No change to `lerp` is justified");
        expect(report).toContain(
            "Excluded inputs do not count as tested evidence"
        );
        expect(report).not.toContain("/home/alex");
    });
});
