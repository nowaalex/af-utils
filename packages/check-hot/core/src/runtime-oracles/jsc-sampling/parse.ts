import type { HotJscSamplingSummary } from "../../types.js";

/** Public subset returned by `bun:jsc.profile`. */
export interface BunSamplingProfile {
    bytecodes: string;
    functions: string;
    stackTraces: readonly string[];
}

const tierNames = [
    "LLInt",
    "Baseline",
    "DFG",
    "FTL",
    "js builtin",
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
const totalSample = /Total samples:\s*(\d+)(?=\s|$)/gu;
const maxStackTraces = 50;
const maxStackTraceCharacters = 4_096;

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
    const rawStackTraces = Array.isArray(record.stackTraces)
        ? record.stackTraces
        : [];
    if (typeof record.bytecodes !== "string") {
        issues.push("missing or invalid bytecode summary");
    }
    if (typeof record.functions !== "string") {
        issues.push("missing or invalid function summary");
    }
    if (!Array.isArray(record.stackTraces)) {
        issues.push("missing or invalid stack trace table");
    }
    const validStackTraces = rawStackTraces.filter(trace => {
        if (typeof trace === "string") return true;
        issues.push("invalid stack trace entry");
        return false;
    });
    for (const line of bytecodes.split(/\r?\n/u)) {
        const match = tierLine.exec(line);
        if (!match) {
            if (knownTierPrefix.test(line)) {
                issues.push(
                    `malformed tier line ${JSON.stringify(line.trim())}`
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
    const explicitTotals = [...functions.matchAll(totalSample)].map(match =>
        Number(match[1])
    );
    if (functions.includes("Total samples:") && explicitTotals.length === 0) {
        issues.push("malformed total sample count");
    }
    if (
        explicitTotals.some(total => !Number.isSafeInteger(total)) ||
        new Set(explicitTotals).size > 1
    ) {
        issues.push("conflicting or invalid total sample counts");
    }
    const explicitTotal = explicitTotals[0];
    let hasExplicitTotal = false;
    let totalSamples = 0;
    if (explicitTotal !== undefined && Number.isSafeInteger(explicitTotal)) {
        hasExplicitTotal = true;
        totalSamples = explicitTotal;
        for (const [name, tier] of Object.entries(tiers)) {
            if (explicitTotal === 0) {
                if (tier.samples !== 0 || tier.percent !== 0) {
                    issues.push(
                        `tier ${name} is inconsistent with zero total samples`
                    );
                }
                continue;
            }
            const expectedPercent = (tier.samples / explicitTotal) * 100;
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
                : !hasExplicitTotal
                  ? "Bun's sampling output did not expose an explicit total; overlapping tier categories were retained but not summed."
                  : totalSamples === 0
                    ? "Bun's profiler returned no samples; tier distribution is unobserved."
                    : Object.keys(tiers).length === 0
                      ? "Bun's sampling output did not contain a recognized tier breakdown."
                      : undefined
    };
};
