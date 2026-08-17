import { describe, expect, test } from "vitest";

import { formatHotRunSummary } from "../src/report.js";
import type { HotRunSummary } from "../src/types.js";

describe("check-hot CI report", () => {
    test("reduces a raw V8 bailout to its function and reason", () => {
        const deoptimization =
            "[bailout (kind: deopt-eager, reason: Insufficient type feedback for generic keyed access): begin. deoptimizing <JSFunction _notify (sfi=1)>]";
        const summary: HotRunSummary = {
            suite: "fixture",
            problems: [],
            coverageComplete: true,
            passed: false,
            runs: [
                {
                    runtime: "node",
                    tier: "turbofan",
                    mode: "combined",
                    scenarios: ["events"],
                    repetition: 1,
                    durationMs: 10,
                    passed: false,
                    coverage: [],
                    deoptimizations: [deoptimization],
                    problems: [
                        {
                            problemId: "v8-guarded-deoptimization",
                            message: "V8 deoptimized one guarded hot path"
                        }
                    ],
                    stdout: "",
                    stderr: "",
                    command: ["node"],
                    events: []
                }
            ]
        };

        const report = formatHotRunSummary(summary);

        expect(report).toContain(
            "deopt: _notify: Insufficient type feedback for generic keyed access"
        );
        expect(report).toContain("first appeared during guarded stress");
        expect(report).not.toContain("begin. deoptimizing");
    });

    test("explains dependent allocation-site invalidation without trace noise", () => {
        const line =
            "[marking dependent code <Code TURBOFAN_JS> (<SharedFunctionInfo compile>) for deoptimization, reason: dependent allocation site tenuring changed]";
        const summary: HotRunSummary = {
            suite: "fixture",
            problems: [],
            coverageComplete: true,
            passed: false,
            runs: [
                {
                    runtime: "node",
                    tier: "turbofan",
                    mode: "combined",
                    scenarios: ["compile"],
                    repetition: 1,
                    durationMs: 10,
                    passed: false,
                    coverage: [],
                    deoptimizations: [line],
                    problems: [],
                    stdout: "",
                    stderr: "",
                    command: ["node"],
                    events: []
                }
            ]
        };

        const report = formatHotRunSummary(summary);

        expect(report).toContain(
            "deopt: compile: dependent allocation site tenuring changed"
        );
        expect(report).toContain("GC-policy noise");
        expect(report).not.toContain("compile>)");
    });

    test("prints exact runtime and engine versions", () => {
        const summary: HotRunSummary = {
            suite: "fixture",
            problems: [],
            coverageComplete: true,
            passed: true,
            runs: [
                {
                    runtime: "deno",
                    tier: "maglev",
                    mode: "isolated",
                    scenarios: ["map"],
                    repetition: 1,
                    durationMs: 12,
                    passed: true,
                    coverage: [],
                    worker: {
                        suite: "fixture",
                        runtime: {
                            name: "deno",
                            version: "2.9.2",
                            engine: "v8",
                            engineVersion: "14.2.231.21",
                            tier: "maglev",
                            oracleId: "v8-native-intrinsics",
                            oracleVersion: "1"
                        },
                        scenarios: ["map"],
                        targets: [],
                        checks: [],
                        invocations: {},
                        coverage: [],
                        problems: [],
                        events: []
                    },
                    deoptimizations: [],
                    problems: [],
                    stdout: "",
                    stderr: "",
                    command: ["deno"],
                    events: []
                }
            ]
        };

        expect(formatHotRunSummary(summary)).toContain(
            "PASS deno@2.9.2/v8@14.2.231.21/v8-native-intrinsics@1/maglev"
        );
    });

    test("does not present a JIT-only pass as complete obligation coverage", () => {
        const summary: HotRunSummary = {
            suite: "fixture",
            problems: [
                {
                    problemId: "coverage-obligation-blocked",
                    targetId: "obligation:shape",
                    message: "obligation:shape remained blocked"
                }
            ],
            coverageComplete: false,
            passed: false,
            runs: [
                {
                    runtime: "node",
                    tier: "turbofan",
                    mode: "combined",
                    scenarios: ["shape"],
                    repetition: 1,
                    durationMs: 10,
                    passed: true,
                    coverage: [
                        {
                            obligationId: "obligation:shape",
                            status: "blocked",
                            reason: "no safe seed",
                            scenarios: [],
                            preflight: {
                                obligationId: "obligation:shape",
                                scenarioId: "shape:auto:obligation:shape",
                                sampleId: "shape:branch-seed",
                                evidenceId: "evidence:shape",
                                mutationFamily: "object-shape",
                                status: "blocked",
                                semanticVerification: "mutation-verified"
                            }
                        }
                    ],
                    deoptimizations: [],
                    problems: [],
                    stdout: "",
                    stderr: "",
                    command: ["node"],
                    events: []
                }
            ]
        };

        const report = formatHotRunSummary(summary);
        expect(report).toContain("JIT PASS / COVERAGE BLOCKED");
        expect(report).toContain(
            "FAIL: runtime oracles 1/1 passed; obligation coverage incomplete"
        );
        expect(formatHotRunSummary(summary, { verbose: true })).toContain(
            "selected semantic sample: shape:branch-seed"
        );
    });

    test("labels CPU shares as whole diagnostic-process samples", () => {
        const summary: HotRunSummary = {
            suite: "cpu-fixture",
            problems: [],
            coverageComplete: true,
            passed: true,
            runs: [
                {
                    runtime: "node",
                    tier: "turbofan",
                    mode: "combined",
                    scenarios: ["hot"],
                    repetition: 1,
                    durationMs: 10,
                    passed: true,
                    coverage: [],
                    deoptimizations: [],
                    problems: [],
                    stdout: "",
                    stderr: "",
                    command: ["node"],
                    events: [],
                    diagnostics: {
                        cpuProfile: {
                            oracleVersion: "1",
                            totalSamples: 100,
                            unattributedSamples: 2,
                            functions: [
                                {
                                    functionName: "hot",
                                    candidateId: "fixture.js#hot",
                                    samples: 4,
                                    sampleShare: 0.04,
                                    correlation: "target"
                                },
                                {
                                    functionName: "loader",
                                    samples: 96,
                                    sampleShare: 0.96,
                                    correlation: "name-only"
                                }
                            ],
                            unobservedCandidateIds: []
                        }
                    }
                }
            ]
        };

        const report = formatHotRunSummary(summary, { verbose: true });
        expect(report).toContain("CPU whole-process ranking");
        expect(report).toContain(
            "authenticated analyzer candidates=4 sample(s) (4.00% of the diagnostic process)"
        );
        expect(report).toContain("96.00% of whole diagnostic process");
        expect(report).not.toContain("production hotness");
    });
});
