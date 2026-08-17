import { describe, expect, test } from "vitest";

import { parseJscSamplingProfile } from "./parse.js";

describe("JSC sampling profile", () => {
    test("extracts public tier distribution", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "Sampling rate: 100 microseconds. Total samples: 40",
                bytecodes: [
                    "Tier breakdown:",
                    "LLInt: 2 (5.000000%)",
                    "Baseline: 10 (25.000000%)",
                    "DFG: 20 (50.000000%)",
                    "FTL: 8 (20.000000%)"
                ].join("\n"),
                stackTraces: ["hot@fixture.js:1:1"]
            },
            100
        );
        expect(result.totalSamples).toBe(40);
        expect(result.tiers.DFG).toEqual({ samples: 20, percent: 50 });
        expect(result.stackTraces).toEqual(["hot@fixture.js:1:1"]);
        expect(result.stackTraceCount).toBe(1);
        expect(result.stackTracesTruncated).toBe(false);
        expect(result.gap).toBeUndefined();
    });

    test("keeps an empty sample advisory", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "Total samples: 0",
                bytecodes: "",
                stackTraces: []
            },
            100
        );
        expect(result.gap).toContain("no samples");
    });

    test("bounds public stack traces without hiding their original count", () => {
        const stackTraces = Array.from({ length: 51 }, (_, index) =>
            index === 0 ? "x".repeat(4_097) : `trace-${index}`
        );
        const result = parseJscSamplingProfile(
            {
                functions: "Total samples: 1",
                bytecodes: "DFG: 1 (100%)",
                stackTraces
            },
            100
        );

        expect(result.stackTraceCount).toBe(51);
        expect(result.stackTraces).toHaveLength(50);
        expect(result.stackTraces[0]).toBe("x".repeat(4_096));
        expect(result.stackTraces.at(-1)).toBe("trace-49");
        expect(result.stackTracesTruncated).toBe(true);
    });

    test.each([
        [Array.from({ length: 50 }, () => "short"), false],
        [Array.from({ length: 51 }, () => "short"), true],
        [["x".repeat(4_096)], false],
        [["x".repeat(4_097), "short"], true]
    ])(
        "classifies stack-trace truncation boundaries",
        (stackTraces, expected) => {
            const result = parseJscSamplingProfile(
                {
                    functions: "Total samples: 1",
                    bytecodes: "DFG: 1 (100%)",
                    stackTraces
                },
                100
            );
            expect(result.stackTracesTruncated).toBe(expected);
        }
    );

    test("recognizes every public tier label with CRLF and decimal percentages", () => {
        const bytecodes = [
            " LLInt: 1 (1.25%) ",
            "Baseline: 2 (2.5%)",
            "DFG: 3 (3.75%)",
            "FTL: 4 (5%)",
            "js builtin: 5 (6.25%)",
            "Wasm: 6 (7.5%)",
            "Host: 7 (8.75%)",
            "RegExp: 8 (10%)",
            "C/C++: 9 (11.25%)",
            "Unknown Executable: 10 (12.5%)"
        ].join("\r\n");
        const result = parseJscSamplingProfile(
            {
                functions: "Total samples: 80",
                bytecodes,
                stackTraces: []
            },
            250
        );

        expect(result.sampleIntervalMicroseconds).toBe(250);
        expect(result.oracleVersion).toBe("1");
        expect(result.totalSamples).toBe(80);
        expect(result.tiers).toEqual({
            LLInt: { samples: 1, percent: 1.25 },
            Baseline: { samples: 2, percent: 2.5 },
            DFG: { samples: 3, percent: 3.75 },
            FTL: { samples: 4, percent: 5 },
            "js builtin": { samples: 5, percent: 6.25 },
            Wasm: { samples: 6, percent: 7.5 },
            Host: { samples: 7, percent: 8.75 },
            RegExp: { samples: 8, percent: 10 },
            "C/C++": { samples: 9, percent: 11.25 },
            "Unknown Executable": { samples: 10, percent: 12.5 }
        });
        expect(result.functions).toBe("Total samples: 80");
        expect(result.bytecodes).toBe(bytecodes);
        expect(result.gap).toBeUndefined();
    });

    test("uses an explicit total instead of the tier sum", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "Total samples: 99",
                bytecodes: "DFG: 2 (2.0202%)",
                stackTraces: []
            },
            100
        );

        expect(result.totalSamples).toBe(99);
        expect(result.tiers.DFG).toEqual({ samples: 2, percent: 2.0202 });
        expect(result.gap).toBeUndefined();
    });

    test("accepts overlapping tier categories without summing them", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "Total samples: 100",
                bytecodes: "Baseline: 80 (80%)\nDFG: 30 (30%)",
                stackTraces: []
            },
            100
        );

        expect(result.totalSamples).toBe(100);
        expect(result.tiers).toEqual({
            Baseline: { samples: 80, percent: 80 },
            DFG: { samples: 30, percent: 30 }
        });
        expect(result.gap).toBeUndefined();
    });

    test("accepts the exact printed rounding boundary", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "Total samples: 200",
                bytecodes: "DFG: 101 (50%)",
                stackTraces: []
            },
            100
        );

        expect(result.gap).toBeUndefined();
    });

    test("retains tiers but reports a missing explicit total", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "",
                bytecodes: "DFG: 7 (70%)",
                stackTraces: []
            },
            100
        );

        expect(result.totalSamples).toBe(0);
        expect(result.tiers.DFG).toEqual({ samples: 7, percent: 70 });
        expect(result.gap).toContain("explicit total");
        expect(result.gap).toContain("not summed");
    });

    test("accepts the minimum interval and a complete 100 percent tier", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "Total samples: 1",
                bytecodes: "DFG: 1 (100%)",
                stackTraces: []
            },
            1
        );

        expect(result).toMatchObject({
            sampleIntervalMicroseconds: 1,
            totalSamples: 1,
            tiers: { DFG: { samples: 1, percent: 100 } },
            gap: undefined
        });
    });

    test("retains normalized details and separators for multiple parse issues", () => {
        const result = parseJscSamplingProfile(
            {
                functions: "",
                bytecodes: "  DFG: nope  \n FTL: nope ",
                stackTraces: []
            },
            100
        );

        expect(result.gap).toBe(
            `Bun's sampling output is not safely parseable: malformed tier line "DFG: nope"; malformed tier line "FTL: nope".`
        );
    });

    test("distinguishes missing tier data from a sample-free profile", () => {
        const noTiers = parseJscSamplingProfile(
            {
                functions: "Total samples: 12",
                bytecodes: "FutureTier: 12 (100%)",
                stackTraces: []
            },
            100
        );
        const noSamples = parseJscSamplingProfile(
            {
                functions: "Total samples: 0",
                bytecodes: "LLInt: 0 (0%)",
                stackTraces: []
            },
            100
        );

        expect(noTiers.gap).toContain("recognized tier breakdown");
        expect(noSamples.gap).toContain("no samples");
    });

    test.each([
        ["Total samples: 10", "DFG: 4 (50%)", "count and percentage"],
        ["Total samples: 100", "DFG: 30 (31.0%)", "count and percentage"],
        ["Total samples: 0", "DFG: 1 (0%)", "zero total samples"],
        ["Total samples: 0", "DFG: 0 (1%)", "zero total samples"]
    ])(
        "rejects tier evidence inconsistent with its explicit total",
        (functions, bytecodes, expected) => {
            const result = parseJscSamplingProfile(
                { functions, bytecodes, stackTraces: [] },
                100
            );

            expect(result.gap).toContain(expected);
        }
    );

    test.each([
        [null, "missing or invalid bytecode summary"],
        [1, "missing or invalid bytecode summary"],
        [{ functions: "", bytecodes: 1, stackTraces: [] }, "bytecode"],
        [{ functions: 1, bytecodes: "", stackTraces: [] }, "function"],
        [{ functions: "", bytecodes: "", stackTraces: 1 }, "stack trace table"],
        [
            { functions: "", bytecodes: "", stackTraces: ["valid", 1] },
            "stack trace entry"
        ]
    ])("reports malformed public profile shapes", (profile, expected) => {
        const result = parseJscSamplingProfile(profile as never, 100);

        expect(result.gap).toContain(expected);
        if (profile === null || typeof profile !== "object") {
            expect(result).toMatchObject({
                functions: "",
                bytecodes: "",
                stackTraces: [],
                stackTraceCount: 0
            });
        }
    });

    test.each([
        ["DFG: nope", "malformed tier line"],
        ["DFG: 1 (...%)", "malformed tier line"],
        ["DFG: 1 (101%)", "invalid tier values"],
        ["DFG: 9007199254740992 (1%)", "invalid tier values"],
        ["DFG: 1 (1%)\nDFG: 2 (2%)", "duplicate tier line"]
    ])("rejects malformed tier evidence: %s", (bytecodes, expected) => {
        const result = parseJscSamplingProfile(
            { functions: "", bytecodes, stackTraces: [] },
            100
        );

        expect(result.gap).toContain(expected);
    });

    test.each([
        ["Total samples: -1", "malformed total sample count"],
        ["Total samples: 1.5", "malformed total sample count"],
        ["Total samples: 1x", "malformed total sample count"],
        [
            "Total samples: 1\nTotal samples: 2",
            "conflicting or invalid total sample counts"
        ],
        [
            "Total samples: 9007199254740992",
            "conflicting or invalid total sample counts"
        ]
    ])("rejects malformed total evidence: %s", (functions, expected) => {
        const result = parseJscSamplingProfile(
            { functions, bytecodes: "DFG: 1 (100%)", stackTraces: [] },
            100
        );

        expect(result.gap).toContain(expected);
    });

    test.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
        "rejects invalid sampling interval %s",
        interval => {
            expect(() =>
                parseJscSamplingProfile(
                    {
                        functions: "",
                        bytecodes: "",
                        stackTraces: []
                    },
                    interval
                )
            ).toThrow("positive safe integer");
        }
    );
});
