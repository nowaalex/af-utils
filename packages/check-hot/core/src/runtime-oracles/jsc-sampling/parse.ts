import type { HotJscSamplingSummary } from "../../types.js";

interface BunStructuredStackTraceTable {
    traces: readonly unknown[];
}

/** Public subset returned by `bun:jsc.profile`. */
export interface BunSamplingProfile {
    bytecodes: string;
    functions: string;
    stackTraces: readonly string[] | BunStructuredStackTraceTable;
}

const tierNames = [
    "LLInt",
    "Baseline",
    "DFG",
    "FTL",
    "js builtin",
    "IPInt",
    "BBQ",
    "OMG",
    "Wasm",
    "Host",
    "RegExp",
    "C/C++",
    "Unknown Executable"
] as const;
const escapedTierNames = tierNames
    .map(name => name.replaceAll(/[+]/gu, "\\$&"))
    .join("|");
const tierLine = new RegExp(
    `^\\s*(${escapedTierNames}):\\s*(\\d+)\\s*\\((\\d+(?:\\.\\d+)?)%\\)\\s*$`,
    "u"
);
const knownTierPrefix = new RegExp(`^\\s*(?:${escapedTierNames})\\s*:`, "u");
const tierLikeLine = /^\s*([^:]+):\s*\d+\s*\(\d+(?:\.\d+)?%\)\s*$/u;
const totalSample = /Total samples:\s*(\d+)(?=\s|$)/gu;
const maxStackTraces = 50;
const maxStackTraceCharacters = 4_096;

const serializeStackTrace = (trace: unknown): string | undefined => {
    if (typeof trace === "string") return trace;
    if (typeof trace !== "object" || trace === null) return undefined;
    try {
        const serialized = JSON.stringify(trace);
        return typeof serialized === "string" ? serialized : undefined;
    } catch {
        return undefined;
    }
};

const extractTotals = (summary: string, issues: string[], label: string) => {
    const totals = [...summary.matchAll(totalSample)].map(match =>
        Number(match[1])
    );
    if (summary.includes("Total samples:") && totals.length === 0) {
        issues.push(`malformed ${label} total sample count`);
    }
    if (
        totals.some(total => !Number.isSafeInteger(total)) ||
        new Set(totals).size > 1
    ) {
        issues.push(`conflicting or invalid ${label} total sample counts`);
    }
    const total = totals[0];
    return total !== undefined && Number.isSafeInteger(total)
        ? total
        : undefined;
};

/** Parse Bun's documented formatted tier breakdown without claiming current tier. */
export const parseJscSamplingProfile = (
    profile: BunSamplingProfile,
    sampleIntervalMicroseconds: number
): HotJscSamplingSummary => {
    if (
        !Number.isSafeInteger(sampleIntervalMicroseconds) ||
        sampleIntervalMicroseconds < 1
    ) {
        throw new RangeError(
            "JSC sampling interval must be a positive safe integer"
        );
    }
    const tiers: Record<string, { samples: number; percent: number }> = {};
    const tierPercentDecimals = new Map<string, number>();
    const issues: string[] = [];
    const record =
        typeof profile === "object" && profile !== null
            ? (profile as Partial<BunSamplingProfile>)
            : {};
    const bytecodes =
        typeof record.bytecodes === "string" ? record.bytecodes : "";
    const functions =
        typeof record.functions === "string" ? record.functions : "";
    const structuredStackTraces =
        typeof record.stackTraces === "object" &&
        record.stackTraces !== null &&
        "traces" in record.stackTraces &&
        Array.isArray(record.stackTraces.traces)
            ? record.stackTraces.traces
            : undefined;
    const rawStackTraces = Array.isArray(record.stackTraces)
        ? record.stackTraces
        : (structuredStackTraces ?? []);
    if (typeof record.bytecodes !== "string") {
        issues.push("missing or invalid bytecode summary");
    }
    if (typeof record.functions !== "string") {
        issues.push("missing or invalid function summary");
    }
    if (!Array.isArray(record.stackTraces) && !structuredStackTraces) {
        issues.push("missing or invalid stack trace table");
    }
    const validStackTraces = rawStackTraces.flatMap(trace => {
        const serialized = serializeStackTrace(trace);
        if (serialized !== undefined) return [serialized];
        issues.push("invalid stack trace entry");
        return [];
    });
    for (const line of bytecodes.split(/\r?\n/u)) {
        const match = tierLine.exec(line);
        if (!match) {
            if (knownTierPrefix.test(line)) {
                issues.push(
                    `malformed tier line ${JSON.stringify(line.trim())}`
                );
            } else if (tierLikeLine.test(line)) {
                issues.push(
                    `unsupported tier line ${JSON.stringify(line.trim())}`
                );
            }
            continue;
        }
        const name = match[1] as string;
        const samplesText = match[2] as string;
        const percentText = match[3] as string;
        const samples = Number(samplesText);
        const percent = Number(percentText);
        if (
            !Number.isSafeInteger(samples) ||
            !Number.isFinite(percent) ||
            percent > 100
        ) {
            issues.push(`invalid tier values for ${name}`);
            continue;
        }
        if (tiers[name]) {
            issues.push(`duplicate tier line for ${name}`);
            continue;
        }
        tiers[name] = { samples, percent };
        const decimalPoint = percentText.indexOf(".");
        tierPercentDecimals.set(
            name,
            decimalPoint < 0 ? 0 : percentText.length - decimalPoint - 1
        );
    }
    const functionTotal = extractTotals(functions, issues, "function");
    const bytecodeTotal = extractTotals(bytecodes, issues, "bytecode");
    // Bun can include the profiler wrapper in the bytecode total while omitting
    // it from the function table. Tier percentages use the bytecode total.
    const tierTotal = bytecodeTotal ?? functionTotal;
    const totalSamples = tierTotal ?? 0;
    if (tierTotal !== undefined) {
        for (const [name, tier] of Object.entries(tiers)) {
            if (tierTotal === 0) {
                if (tier.samples !== 0 || tier.percent !== 0) {
                    issues.push(
                        `tier ${name} is inconsistent with zero total samples`
                    );
                }
                continue;
            }
            const expectedPercent = (tier.samples / tierTotal) * 100;
            const decimals = tierPercentDecimals.get(name) ?? 0;
            const tolerance = 0.5 * 10 ** -decimals;
            if (Math.abs(tier.percent - expectedPercent) > tolerance) {
                issues.push(
                    `tier ${name} count and percentage disagree with total samples`
                );
            }
        }
    }
    const stackTraces = validStackTraces
        .slice(0, maxStackTraces)
        .map(trace => trace.slice(0, maxStackTraceCharacters));
    return {
        oracleVersion: "1",
        sampleIntervalMicroseconds,
        totalSamples,
        tiers,
        functions,
        bytecodes,
        stackTraces,
        stackTraceCount: rawStackTraces.length,
        stackTracesTruncated:
            rawStackTraces.length > maxStackTraces ||
            validStackTraces.some(
                trace => trace.length > maxStackTraceCharacters
            ),
        gap:
            issues.length > 0
                ? `Bun's sampling output is not safely parseable: ${issues.join("; ")}.`
                : tierTotal === undefined
                  ? "Bun's sampling output did not expose an explicit total; overlapping tier categories were retained but not summed."
                  : totalSamples === 0
                    ? "Bun's profiler returned no samples; tier distribution is unobserved."
                    : Object.keys(tiers).length === 0
                      ? "Bun's sampling output did not contain a recognized tier breakdown."
                      : undefined
    };
};
