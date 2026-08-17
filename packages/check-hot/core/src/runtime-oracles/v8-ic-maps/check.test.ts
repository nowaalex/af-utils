import { describe, expect, test } from "vitest";

import { checkV8IcMapDiagnostics } from "./check.js";
import type { HotV8LogSummary } from "../../types.js";

const summary = (
    inlineCaches: HotV8LogSummary["graph"]["inlineCaches"],
    gap?: string
): HotV8LogSummary => ({
    oracleVersion: "1",
    engineVersion: "13.0",
    events: [],
    graph: { maps: [], transitions: [], inlineCaches },
    targetScope: {
        requestedTargetIds: ["hot"],
        matchedTargetIds: ["hot"],
        unmatchedTargetIds: [],
        ambiguousTargetIds: []
    },
    gap
});

const transition = (siteId: string, to: string) => ({
    siteId,
    operation: "LoadIC",
    from: "1",
    to,
    key: "value",
    correlation: "name-only" as const,
    targetId: "hot",
    functionName: "readValue"
});

describe("V8 IC/Map advisory checker", () => {
    test("emits distinct P and N advice with target evidence", () => {
        expect(
            checkV8IcMapDiagnostics(
                summary([transition("site-p", "P"), transition("site-n", "N")])
            )
        ).toEqual([
            expect.objectContaining({
                problemId: "v8-inline-cache-polymorphism-observed",
                targetId: "hot",
                confidence: "medium",
                message: "LoadIC 1→P for value in readValue",
                detail: expect.stringContaining("site=site-p")
            }),
            expect.objectContaining({
                problemId: "v8-inline-cache-megamorphism-observed",
                targetId: "hot",
                confidence: "medium",
                detail: expect.stringContaining("correlation=name-only")
            })
        ]);
    });

    test("deduplicates one state per site and ignores ordinary IC/Map evidence", () => {
        const repeated = transition("same", "P");
        expect(
            checkV8IcMapDiagnostics(
                summary([
                    transition("stable", "1"),
                    repeated,
                    { ...repeated, from: "P" }
                ])
            ).map(problem => problem.problemId)
        ).toEqual(["v8-inline-cache-polymorphism-observed"]);
        expect(checkV8IcMapDiagnostics(summary([]))).toEqual([]);
    });

    test("retains a diagnostic gap beside useful observations", () => {
        const problems = checkV8IcMapDiagnostics(
            summary([transition("site", "N")], "partial target scope")
        );
        expect(problems.map(problem => problem.problemId)).toEqual([
            "v8-ic-map-diagnostic-gap",
            "v8-inline-cache-megamorphism-observed"
        ]);
    });

    test("does not invent an IC key or function name when the log omitted them", () => {
        const withoutOptionalLabels = {
            siteId: "anonymous",
            operation: "LoadIC",
            from: "1",
            to: "P",
            correlation: "name-only" as const,
            targetId: "hot"
        };

        expect(
            checkV8IcMapDiagnostics(summary([withoutOptionalLabels]))
        ).toEqual([
            expect.objectContaining({
                problemId: "v8-inline-cache-polymorphism-observed",
                message: "LoadIC 1→P"
            })
        ]);
    });
});
