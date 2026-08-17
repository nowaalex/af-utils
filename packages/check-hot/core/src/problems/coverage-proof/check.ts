import type { HotCoverageLedgerEntry } from "../../types.js";
import type { HotProblemOccurrence } from "../types.js";

/** Convert one non-pass ledger state into a stable reportable problem. */
export const coverageProblem = (
    entry: HotCoverageLedgerEntry
): HotProblemOccurrence | undefined => {
    if (entry.status === "failed") {
        return {
            problemId: "coverage-obligation-failed",
            targetId: entry.obligationId,
            message: entry.reason
        };
    }
    if (entry.status === "blocked") {
        return {
            problemId: "coverage-obligation-blocked",
            targetId: entry.obligationId,
            message: entry.reason
        };
    }
    if (entry.status === "unsupported") {
        return {
            problemId: "coverage-obligation-unsupported",
            targetId: entry.obligationId,
            message: entry.reason
        };
    }
};
