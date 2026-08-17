import type {
    HotPreflightOutcome,
    HotDiagnosticKind,
    HotRunMode,
    HotRuntimeName,
    HotWorkerResult,
    V8Tier
} from "./types.js";
import { writeSync } from "node:fs";

const stdoutRetrySignal = new Int32Array(
    new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
);

/** Prefix used to recover structured worker output from engine traces. */
export const WORKER_RESULT_PREFIX = "@@CHECK_HOT_RESULT@@";

/** V8 trace function delimiting the start of guarded stress. */
export const V8_STRESS_START = "__checkHotStressBoundary__";

/** V8 trace function delimiting the end of guarded stress. */
export const V8_STRESS_END = "__checkHotStressEndBoundary__";

/** Serializable request passed to one fresh runtime process. */
export interface HotWorkerRequest {
    /** Suite module file URL. */
    suiteUrl: string;
    /** Scenario IDs selected for this process. */
    scenarios: readonly string[];
    /** Runtime selected by the orchestrator. */
    runtime: HotRuntimeName;
    /** Requested tier. */
    tier: V8Tier | "jsc";
    /** Combined or isolated execution mode. */
    mode: HotRunMode;
    /** Whether verbose representation output is requested. */
    inspect: boolean;
    /** Orchestrator-level warmup iteration override. */
    warmupIterations?: number;
    /** Orchestrator-level guarded-stress iteration override. */
    stressIterations?: number;
    /** Whether this disposable process validates semantics or measures JIT state. */
    purpose?: "preflight" | "validation" | "measurement" | "diagnostic";
    /** One advisory collector enabled in a structurally separate rerun. */
    diagnostic?: HotDiagnosticKind;
    /** Outcomes transferred from a discarded preflight into measurement setup. */
    preflightOutcomes?: readonly HotPreflightOutcome[];
}

/** Parse the worker request from a runtime's final command-line argument. */
export const parseWorkerRequest = (argument: string | undefined) => {
    if (!argument) throw new Error("Missing check-hot worker request");
    return JSON.parse(argument) as HotWorkerRequest;
};

/** Write one protocol line and honor stdout backpressure before natural exit. */
export const emitProtocolLine = async (payload: string) => {
    const bytes = new TextEncoder().encode(payload);
    const deno = (
        globalThis as {
            Deno?: { stdout: { write(data: Uint8Array): Promise<number> } };
        }
    ).Deno;
    if (deno) {
        let offset = 0;
        while (offset < bytes.length) {
            // oxlint-disable-next-line no-await-in-loop -- Deno stdout may accept only a prefix of the final protocol record.
            const written = await deno.stdout.write(bytes.subarray(offset));
            if (written <= 0) {
                throw new Error("Deno stdout accepted zero protocol bytes");
            }
            offset += written;
        }
        return;
    }
    let offset = 0;
    while (offset < bytes.length) {
        try {
            const written = writeSync(
                process.stdout.fd,
                bytes,
                offset,
                bytes.length - offset
            );
            if (written <= 0) {
                throw new Error("stdout accepted zero protocol bytes");
            }
            offset += written;
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code === "EINTR") continue;
            if (code !== "EAGAIN" && code !== "EWOULDBLOCK") throw error;

            // stdout pipes are non-blocking. The parent drains concurrently,
            // so pause this final synchronous writer briefly and retry. This
            // keeps the process alive without trusting a buffered callback.
            Atomics.wait(stdoutRetrySignal, 0, 0, 1);
        }
    }
};

/** Emit one machine-readable result without suppressing engine trace output. */
export const emitWorkerResult = (result: HotWorkerResult) =>
    emitProtocolLine(`${WORKER_RESULT_PREFIX}${JSON.stringify(result)}\n`);
