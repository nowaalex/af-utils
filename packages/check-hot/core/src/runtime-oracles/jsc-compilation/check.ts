import type { HotProblemOccurrence } from "../../problems/types.js";

/** Interpret Bun's public counters without claiming current-tier state. */
export const classifyJscCompilation = (dfgCompiles: number) => ({
    compiledHistorically: dfgCompiles > 0,
    currentTier: "not-observable" as const
});

/** Check the two stability facts Bun/JSC exposes publicly. */
export const checkJscCompilation = (
    targetId: string,
    dfgCompiles: number,
    retriesBefore: number,
    retriesAfter: number
): readonly HotProblemOccurrence[] => {
    const problems: HotProblemOccurrence[] = [];
    if (!classifyJscCompilation(dfgCompiles).compiledHistorically) {
        problems.push({
            problemId: "jsc-dfg-not-compiled",
            targetId,
            message: `${targetId} was not compiled by JavaScriptCore DFG`
        });
    }
    if (retriesAfter > retriesBefore) {
        problems.push({
            problemId: "jsc-reoptimization-during-stress",
            targetId,
            message: `${targetId} increased its JavaScriptCore reoptimization retry count during stress`
        });
    }
    return problems;
};
