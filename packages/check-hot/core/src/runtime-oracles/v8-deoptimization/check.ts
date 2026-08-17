import { V8_STRESS_END, V8_STRESS_START } from "../../protocol.js";
import type { HotProblemOccurrence } from "../../problems/types.js";

/** Slice V8 trace output to the phase bracketed by compiled sentinels. */
export const extractGuardedV8Trace = (output: string) => {
    const lines = output.split(/\r?\n/u);
    const end = lines.findIndex(line => line.includes(V8_STRESS_END));
    if (end < 0) return;

    let start = -1;
    for (let index = 0; index < end; index++) {
        if (lines[index].includes(V8_STRESS_START)) start = index;
    }
    if (start < 0) return;
    return lines.slice(start + 1, end);
};

/** Extract eager/lazy and dependent-code deoptimizations from guarded stress. */
export const findV8Deoptimizations = (output: string) =>
    (extractGuardedV8Trace(output) ?? []).filter(
        line =>
            line.includes("deoptimizing") || line.includes("for deoptimization")
    );

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/** Limit trace lines to direct target function names when explicitly requested. */
export const filterTargetDeoptimizations = (
    lines: readonly string[],
    functionNames: readonly string[]
) => {
    const names = [...new Set(functionNames.filter(Boolean))];
    if (names.length === 0) return [];
    const pattern = new RegExp(
        `(?:JSFunction|SharedFunctionInfo) (?:[^<]*<)?(?:${names
            .map(name => escapeRegExp(name))
            .join("|")})(?:[ >])`,
        "u"
    );
    return lines.filter(line => pattern.test(line));
};

/** Complete result of checking one guarded V8 trace interval. */
export interface V8DeoptimizationCheckResult {
    /** Whether at least one output stream contained both sentinels. */
    guardedTraceFound: boolean;
    /** Deoptimization trace lines retained after scope filtering. */
    deoptimizations: readonly string[];
    /** Structured problem occurrences consumed by JSON and human reports. */
    problems: readonly HotProblemOccurrence[];
}

/** Check stdout/stderr without coupling the engine oracle to process spawning. */
export const checkV8Deoptimizations = (
    outputs: readonly string[],
    scope: "all" | "targets",
    functionNames: readonly string[]
): V8DeoptimizationCheckResult => {
    const guardedTraceFound = outputs.some(
        output => extractGuardedV8Trace(output) !== undefined
    );
    let deoptimizations = outputs.flatMap(output =>
        findV8Deoptimizations(output)
    );
    if (scope === "targets") {
        deoptimizations = filterTargetDeoptimizations(
            deoptimizations,
            functionNames
        );
    }
    const problems: HotProblemOccurrence[] = [];
    if (!guardedTraceFound) {
        problems.push({
            problemId: "v8-trace-boundary-missing",
            message: "V8 trace did not contain guarded-stress boundaries"
        });
    }
    for (const detail of deoptimizations) {
        problems.push({
            problemId: "v8-guarded-deoptimization",
            message: "V8 deoptimized a guarded hot-path location",
            detail
        });
    }
    return { guardedTraceFound, deoptimizations, problems };
};
