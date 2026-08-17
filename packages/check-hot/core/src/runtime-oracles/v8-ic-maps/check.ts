import type { HotProblemOccurrence } from "../../problems/types.js";
import type { HotV8LogSummary } from "../../types.js";

/** Convert V8 diagnostic gaps and harmful IC states into non-gating occurrences. */
export const checkV8IcMapDiagnostics = (
    summary: HotV8LogSummary
): readonly HotProblemOccurrence[] => {
    const problems: HotProblemOccurrence[] = summary.gap
        ? [
              {
                  problemId: "v8-ic-map-diagnostic-gap",
                  message: summary.gap
              }
          ]
        : [];
    const seen = new Set<string>();
    for (const transition of summary.graph.inlineCaches) {
        const problemId =
            transition.to === "N"
                ? "v8-inline-cache-megamorphism-observed"
                : transition.to === "P"
                  ? "v8-inline-cache-polymorphism-observed"
                  : undefined;
        if (!problemId) continue;
        const identity = `${problemId}:${transition.siteId}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        problems.push({
            problemId,
            targetId: transition.targetId,
            confidence: "medium",
            message: `${transition.operation} ${transition.from}→${transition.to}${transition.key ? ` for ${transition.key}` : ""}${transition.functionName ? ` in ${transition.functionName}` : ""}`,
            detail: `V8-log correlation=${transition.correlation}; site=${transition.siteId}`
        });
    }
    return problems;
};
