import { WORKER_RESULT_PREFIX } from "./protocol.js";
import type { HotWorkerRequest } from "./protocol.js";
import { hotWorkerResultEnvelopeSchema } from "./structured-result-schemas.js";
import type { HotWorkerResult } from "./types.js";

export {
    checkV8Deoptimizations,
    extractGuardedV8Trace,
    filterTargetDeoptimizations,
    findV8Deoptimizations
} from "./runtime-oracles/v8-deoptimization/check.js";

/** Expected identity and terminal coverage for one disposable worker process. */
export interface WorkerResultExpectation {
    request: HotWorkerRequest;
    obligationIds: readonly string[];
}

/** Fail-closed parse outcome for noisy runtime output. */
export interface WorkerResultParse {
    worker?: HotWorkerResult;
    error?: string;
}

const sameStrings = (left: readonly string[], right: readonly string[]) =>
    JSON.stringify(left) === JSON.stringify(right);

const protocolRecords = (outputs: readonly string[]) => {
    const records: string[] = [];
    for (const output of outputs) {
        let offset = 0;
        while (offset < output.length) {
            const marker = output.indexOf(WORKER_RESULT_PREFIX, offset);
            if (marker < 0) break;
            const start = marker + WORKER_RESULT_PREFIX.length;
            const newline = output.indexOf("\n", start);
            const end = newline < 0 ? output.length : newline;
            records.push(output.slice(start, end).replace(/\r$/u, ""));
            offset = newline < 0 ? output.length : newline + 1;
        }
    }
    return records;
};

const invalid = (reason: string): WorkerResultParse => ({
    error: `Runtime worker result is invalid: ${reason}`
});

/** Recover and authenticate the single structured result embedded in noisy runtime output. */
export const parseWorkerResult = (
    expectation: WorkerResultExpectation,
    ...outputs: readonly string[]
): WorkerResultParse => {
    const records = protocolRecords(outputs);
    if (records.length === 0) return {};
    if (records.length !== 1) {
        return invalid(
            `expected exactly one terminal protocol record, received ${records.length}`
        );
    }

    let value: unknown;
    try {
        value = JSON.parse(records[0]) as unknown;
    } catch {
        return invalid("the terminal protocol record is not valid JSON");
    }
    const parsed = hotWorkerResultEnvelopeSchema.safeParse(value);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return invalid(
            `the terminal protocol schema failed at ${issue?.path.join(".") || "the envelope"}`
        );
    }

    const envelope = parsed.data;
    const request = expectation.request;
    const mismatches: string[] = [];
    if (envelope.requestId !== request.requestId) mismatches.push("requestId");
    if (envelope.runtime !== request.runtime) mismatches.push("runtime");
    if (envelope.tier !== request.tier) mismatches.push("tier");
    if (envelope.mode !== request.mode) mismatches.push("mode");
    if (!sameStrings(envelope.scenarios, request.scenarios))
        mismatches.push("scenarios");
    if (envelope.purpose !== (request.purpose ?? "measurement"))
        mismatches.push("purpose");
    if (envelope.diagnostic !== request.diagnostic)
        mismatches.push("diagnostic");
    if (envelope.result.runtime.name !== request.runtime)
        mismatches.push("result.runtime.name");
    if (envelope.result.runtime.tier !== request.tier)
        mismatches.push("result.runtime.tier");
    const expectedEngine = request.runtime === "bun" ? "jsc" : "v8";
    const expectedOracle =
        expectedEngine === "jsc"
            ? "bun-jsc-public-api"
            : "v8-native-intrinsics";
    if (envelope.result.runtime.engine !== expectedEngine)
        mismatches.push("result.runtime.engine");
    if (envelope.result.runtime.oracleId !== expectedOracle)
        mismatches.push("result.runtime.oracleId");
    if (
        envelope.result.targets.some(target => target.engine !== expectedEngine)
    ) {
        mismatches.push("result.targets.engine");
    }
    if (
        expectedEngine === "v8" &&
        envelope.result.targets.some(
            target =>
                target.engine === "v8" && target.requestedTier !== request.tier
        )
    ) {
        mismatches.push("result.targets.requestedTier");
    }
    if (!sameStrings(envelope.result.scenarios, request.scenarios))
        mismatches.push("result.scenarios");
    if (mismatches.length > 0) {
        return invalid(
            `the terminal protocol record differs from its request in ${mismatches.join(", ")}`
        );
    }

    if (
        envelope.purpose === "diagnostic" ||
        (envelope.purpose === "measurement" &&
            envelope.result.problems.length === 0)
    ) {
        const expected = expectation.obligationIds.toSorted();
        const actual = envelope.result.coverage
            .map(entry => entry.obligationId)
            .toSorted();
        if (!sameStrings(actual, expected)) {
            return invalid(
                "successful terminal coverage does not account for every expected obligation exactly once"
            );
        }
    }

    return { worker: envelope.result as HotWorkerResult };
};
