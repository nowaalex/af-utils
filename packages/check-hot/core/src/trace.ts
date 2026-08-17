import { WORKER_RESULT_PREFIX } from "./protocol.js";
import type { HotWorkerResult } from "./types.js";

export {
    checkV8Deoptimizations,
    extractGuardedV8Trace,
    filterTargetDeoptimizations,
    findV8Deoptimizations
} from "./runtime-oracles/v8-deoptimization/check.js";

/** Recover the structured result embedded in noisy runtime output. */
export const parseWorkerResult = (...outputs: readonly string[]) => {
    for (const output of outputs) {
        const index = output.lastIndexOf(WORKER_RESULT_PREFIX);
        if (index < 0) continue;
        const json = output
            .slice(index + WORKER_RESULT_PREFIX.length)
            .split(/\r?\n/u, 1)[0];
        try {
            return JSON.parse(json) as HotWorkerResult;
        } catch {
            // Keep looking: some runtimes may mirror output between streams.
        }
    }
};
