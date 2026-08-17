import type { HotProblemOccurrence } from "../../problems/types.js";

/** Minimal process result needed to classify liveness independently of spawn. */
export interface WorkerLivenessInput {
    error?: Error & { code?: string };
    status: number | null;
    signal: string | null;
    resultFound: boolean;
    reportedProblemCount?: number;
    timeoutMs: number;
    label?: string;
}

/** Convert process failure modes into stable problem IDs. */
export const checkWorkerLiveness = (
    input: WorkerLivenessInput
): readonly HotProblemOccurrence[] => {
    const problems: HotProblemOccurrence[] = [];
    const label = input.label ?? "Worker";
    if (input.error && !(input.status === 0 && input.resultFound)) {
        problems.push({
            problemId:
                input.error.code === "ETIMEDOUT"
                    ? "runtime-worker-timeout"
                    : "runtime-worker-exit-failure",
            message:
                input.error.code === "ETIMEDOUT"
                    ? `${label} exceeded the ${input.timeoutMs}ms timeout`
                    : input.error.message
        });
    }
    if (!input.resultFound) {
        problems.push({
            problemId: "runtime-worker-result-missing",
            message: `${label} did not emit a structured result`
        });
    }
    if (input.status !== 0 && (input.reportedProblemCount ?? 0) === 0) {
        problems.push({
            problemId: "runtime-worker-exit-failure",
            message: `${label} exited with ${input.status ?? input.signal ?? "unknown status"}`
        });
    }
    return problems;
};
