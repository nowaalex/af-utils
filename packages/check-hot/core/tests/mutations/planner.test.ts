import { describe, expect, test } from "vitest";

import { createModuleSuite } from "../../src/module-suite.js";
import type { HotRuntimeInfo } from "../../src/types.js";
import { createCoverageLedger } from "../../src/worker-shared.js";

const runtime: HotRuntimeInfo = {
    name: "node",
    version: "26.0.0",
    engine: "v8",
    engineVersion: "14.1.0",
    tier: "turbofan",
    oracleId: "v8-native-intrinsics",
    oracleVersion: "1"
};

const preflightOracles = {
    observeMutation: (
        _family: unknown,
        _seed: unknown,
        _value: unknown,
        variant: string
    ) => ({
        variant,
        representation: variant,
        verified: true
    }),
    measureEvidence: async <Value>(
        _evidenceId: string,
        _target: CallableFunction,
        action: () => Value | Promise<Value>
    ) => ({ value: await action(), siteHitCount: 1 })
};

const verifyIncrementMutation = (context: {
    result: unknown;
    args: readonly unknown[];
}) => {
    const expected = Number(context.args[0]) + 1;
    if (
        !Object.is(context.result, expected) &&
        !(Number.isNaN(context.result) && Number.isNaN(expected))
    ) {
        throw new Error("wrong increment result");
    }
};

const evidence = {
    id: "evidence:numeric",
    rule: "numeric-operation",
    candidateId: "fixture.js#increment@1",
    confidence: "dataflow-proven" as const,
    subject: "numeric addition",
    automation: {
        version: 1 as const,
        mutationFamily: "numeric-representation" as const,
        parameterIndex: 0,
        parameterPath: []
    },
    span: {
        file: "/fixture.js",
        relativeFile: "fixture.js",
        sourceSha256: "0".repeat(64),
        start: 0,
        end: 1,
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 2
    },
    ownerSpan: {
        file: "/fixture.js",
        relativeFile: "fixture.js",
        sourceSha256: "0".repeat(64),
        start: 0,
        end: 1,
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 2
    }
};

describe("AST mutation planner", () => {
    test("binds manual coverage to one exact obligation instead of a family", () => {
        const suite = createModuleSuite({
            name: "exact claims",
            load: () =>
                Promise.resolve({
                    merge: (left: object, right: object) => ({
                        ...left,
                        ...right
                    })
                }),
            samples: {
                merge: [
                    {
                        label: "left-shape",
                        args: () => [{ value: 1 }, { value: 2 }],
                        covers: [
                            {
                                obligationId: "obligation:left",
                                mutationFamily: "object-shape"
                            }
                        ]
                    }
                ]
            },
            obligations: [
                {
                    id: "obligation:left",
                    evidenceId: "evidence:left",
                    candidateId: "fixture.js#merge@1",
                    mutationFamily: "object-shape",
                    exportName: "merge",
                    parameterIndex: 0
                },
                {
                    id: "obligation:right",
                    evidenceId: "evidence:right",
                    candidateId: "fixture.js#merge@1",
                    mutationFamily: "object-shape",
                    exportName: "merge",
                    parameterIndex: 1
                }
            ]
        });

        expect(suite.scenarios[0].obligations).toEqual(["obligation:left"]);
        expect(suite.scenarios[1].obligations).toEqual(["obligation:right"]);
    });

    test("does not invoke a target while constructing measurement state", async () => {
        let calls = 0;
        const suite = createModuleSuite({
            name: "disposable preflight",
            load: () =>
                Promise.resolve({
                    increment: (value: number) => {
                        calls++;
                        return value + 1;
                    }
                }),
            samples: {
                increment: [
                    {
                        label: "seed",
                        args: () => [1],
                        verify() {},
                        verifyMutation: verifyIncrementMutation
                    }
                ]
            },
            obligations: [
                {
                    id: "obligation:separate-process",
                    evidenceId: "evidence:numeric",
                    candidateId: "fixture.js#increment@1",
                    mutationFamily: "numeric-representation",
                    exportName: "increment",
                    parameterIndex: 0
                }
            ]
        });
        const automatic = suite.scenarios[1];
        const outcomes = await suite.preflight?.({
            runtime,
            inspect: false,
            scenarios: [automatic.id],
            ...preflightOracles
        });
        expect(calls).toBeGreaterThan(0);
        calls = 0;

        await suite.setup({
            runtime,
            inspect: false,
            scenarios: [automatic.id],
            preflightOutcomes: outcomes ?? []
        });
        expect(calls).toBe(0);
    });

    test("turns a proven parameter flow and a semantic seed into an automatic scenario", async () => {
        const suite = createModuleSuite({
            name: "numeric",
            load: () =>
                Promise.resolve({ increment: (value: number) => value + 1 }),
            samples: {
                increment: [
                    {
                        label: "seed",
                        args: () => [1],
                        verify() {},
                        verifyMutation: verifyIncrementMutation
                    }
                ]
            },
            evidence: [evidence],
            obligations: [
                {
                    id: "obligation:numeric",
                    evidenceId: evidence.id,
                    candidateId: evidence.candidateId,
                    mutationFamily: "numeric-representation",
                    exportName: "increment",
                    parameterIndex: 0
                }
            ]
        });
        const automatic = suite.scenarios.find(scenario =>
            scenario.id.includes("auto:obligation:numeric")
        );

        expect(automatic?.obligations).toEqual(["obligation:numeric"]);
        const outcomes = await suite.preflight?.({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            ...preflightOracles
        });
        const measuredOutcomes = outcomes ?? [];
        for (const outcome of measuredOutcomes) {
            for (const observation of outcome.mutationPlan?.observations ??
                []) {
                if (observation.variant !== "adapter-baseline") {
                    observation.guardedSiteHitCount = 1;
                }
            }
        }
        const state = await suite.setup({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            preflightOutcomes: measuredOutcomes
        });
        const observed: unknown[][] = [];
        if (automatic) {
            const invoke = (
                _target: unknown,
                _receiver: unknown,
                args: readonly unknown[] = []
            ) => {
                observed.push([...args]);
                return Number(args[0]) + 1;
            };
            await automatic.run({
                state,
                phase: "warmup",
                iteration: 1,
                runtime,
                invoke
            });
            await automatic.run({
                state,
                phase: "stress",
                iteration: 1,
                runtime,
                invoke
            });
        }
        expect(observed).toEqual([[1], [1.25]]);
        const incompleteOutcomes = measuredOutcomes.map(outcome => ({
            ...outcome,
            mutationPlan: outcome.mutationPlan
                ? {
                      ...outcome.mutationPlan,
                      observations: outcome.mutationPlan.observations.slice(
                          0,
                          -1
                      )
                  }
                : undefined
        }));
        expect(
            createCoverageLedger(
                suite,
                [automatic?.id as string],
                "passed",
                incompleteOutcomes
            )[0]
        ).toMatchObject({ status: "blocked" });
        expect(
            createCoverageLedger(
                suite,
                [automatic?.id as string],
                "passed",
                measuredOutcomes
            )[0]
        ).toMatchObject({ status: "passed" });
    });

    test("selects and persists the first sample that proves every preflight gate", async () => {
        let activeSample = "";
        let activePhase = "";
        const attempts: string[] = [];
        const suite = createModuleSuite({
            name: "adaptive samples",
            load: () =>
                Promise.resolve({ increment: (value: number) => value + 1 }),
            samples: {
                increment: [
                    {
                        label: "verifier-failure",
                        args: () => [1],
                        before(_iteration, phase) {
                            activeSample = "verifier-failure";
                            activePhase = phase;
                            attempts.push(activeSample);
                        },
                        verify() {
                            throw new Error("deliberate verifier failure");
                        },
                        verifyMutation: verifyIncrementMutation,
                        warmupIterations: 2,
                        stressIterations: 3
                    },
                    {
                        label: "partial-site-hit",
                        args: () => [2],
                        before(_iteration, phase) {
                            activeSample = "partial-site-hit";
                            activePhase = phase;
                            attempts.push(activeSample);
                        },
                        verifyMutation: verifyIncrementMutation,
                        warmupIterations: 5,
                        stressIterations: 4
                    },
                    {
                        label: "exact-site-hit",
                        args: () => [3],
                        before(_iteration, phase) {
                            activeSample = "exact-site-hit";
                            activePhase = phase;
                            attempts.push(activeSample);
                        },
                        verifyMutation: verifyIncrementMutation,
                        warmupIterations: 4,
                        stressIterations: 7
                    },
                    {
                        label: "must-not-run",
                        args: () => [4],
                        before() {
                            throw new Error(
                                "candidate evaluation continued after acceptance"
                            );
                        },
                        verifyMutation: verifyIncrementMutation
                    }
                ]
            },
            evidence: [evidence],
            obligations: [
                {
                    id: "obligation:numeric",
                    evidenceId: evidence.id,
                    candidateId: evidence.candidateId,
                    mutationFamily: "numeric-representation",
                    exportName: "increment",
                    parameterIndex: 0
                }
            ]
        });
        const automatic = suite.scenarios.find(scenario =>
            scenario.id.includes("auto:obligation:numeric")
        );
        expect(automatic).toMatchObject({
            warmupIterations: 5,
            stressIterations: 7
        });

        const outcomes =
            (await suite.preflight?.({
                runtime,
                inspect: false,
                scenarios: [automatic?.id as string],
                observeMutation: preflightOracles.observeMutation,
                async measureEvidence(_evidenceId, _target, action) {
                    const value = await action();
                    return {
                        value,
                        siteHitCount:
                            activeSample === "exact-site-hit" ||
                            (activeSample === "partial-site-hit" &&
                                activePhase === "warmup")
                                ? 1
                                : 0
                    };
                }
            })) ?? [];

        expect(outcomes).toHaveLength(1);
        expect(outcomes[0]).toMatchObject({
            status: "accepted",
            sampleId: "increment:exact-site-hit"
        });
        expect(new Set(attempts)).toEqual(
            new Set(["verifier-failure", "partial-site-hit", "exact-site-hit"])
        );
        const state = await suite.setup({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            preflightOutcomes: outcomes
        });
        const replayed: unknown[][] = [];
        await automatic?.run({
            state,
            phase: "warmup",
            iteration: 0,
            runtime,
            invoke(_target, _receiver, args = []) {
                replayed.push([...args]);
                return Number(args[0]) + 1;
            }
        });
        expect(replayed).toEqual([[3]]);

        await expect(
            suite.setup({
                runtime,
                inspect: false,
                scenarios: [automatic?.id as string],
                preflightOutcomes: [
                    { ...outcomes[0], sampleId: "increment:tampered" }
                ]
            })
        ).rejects.toThrow("selected undeclared sample increment:tampered");
    });

    test("reports one blocked outcome after every semantic sample misses", async () => {
        const suite = createModuleSuite({
            name: "all samples miss",
            load: () =>
                Promise.resolve({ increment: (value: number) => value + 1 }),
            samples: {
                increment: [
                    {
                        label: "first",
                        args: () => [1],
                        verifyMutation: verifyIncrementMutation
                    },
                    {
                        label: "second",
                        args: () => [2],
                        verifyMutation: verifyIncrementMutation
                    }
                ]
            },
            evidence: [evidence],
            obligations: [
                {
                    id: "obligation:numeric",
                    evidenceId: evidence.id,
                    candidateId: evidence.candidateId,
                    mutationFamily: "numeric-representation",
                    exportName: "increment",
                    parameterIndex: 0
                }
            ]
        });
        const automatic = suite.scenarios.find(scenario =>
            scenario.id.includes("auto:obligation:numeric")
        );
        const outcomes = await suite.preflight?.({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            observeMutation: preflightOracles.observeMutation,
            async measureEvidence(_evidenceId, _target, action) {
                return { value: await action(), siteHitCount: 0 };
            }
        });

        expect(outcomes).toHaveLength(1);
        expect(outcomes?.[0]).toMatchObject({
            status: "blocked",
            sampleId: "increment:first"
        });
        expect(outcomes?.[0].reason).toContain("increment:first:");
        expect(outcomes?.[0].reason).toContain("increment:second:");
    });

    test("keeps an incompatible seed as blocked instead of silently omitting it", async () => {
        const suite = createModuleSuite({
            name: "bad-seed",
            load: () =>
                Promise.resolve({ increment: (value: string) => value.length }),
            samples: {
                increment: [{ label: "seed", args: () => ["not-a-number"] }]
            },
            evidence: [evidence],
            obligations: [
                {
                    id: "obligation:numeric",
                    evidenceId: evidence.id,
                    candidateId: evidence.candidateId,
                    mutationFamily: "numeric-representation",
                    exportName: "increment",
                    parameterIndex: 0
                }
            ]
        });
        const automatic = suite.scenarios.find(scenario =>
            scenario.id.includes("auto:obligation:numeric")
        );

        const outcomes = await suite.preflight?.({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            ...preflightOracles
        });
        await suite.setup({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            preflightOutcomes: outcomes ?? []
        });
        expect(
            createCoverageLedger(suite, [automatic?.id as string], "passed")[0]
        ).toMatchObject({
            status: "blocked",
            reason: expect.stringContaining("requires a number seed")
        });
    });

    test("blocks a same-type wrong result through the args-aware mutation verifier", async () => {
        const suite = createModuleSuite({
            name: "wrong-semantics",
            load: () => Promise.resolve({ increment: () => 2 }),
            samples: {
                increment: [
                    {
                        label: "seed",
                        args: () => [1],
                        verify(result) {
                            if (typeof result !== "number") {
                                throw new TypeError("number expected");
                            }
                        },
                        verifyMutation({ result, args }) {
                            if (result !== Number(args[0]) + 1) {
                                throw new Error(
                                    "wrong result for mutated input"
                                );
                            }
                        }
                    }
                ]
            },
            evidence: [evidence],
            obligations: [
                {
                    id: "obligation:numeric",
                    evidenceId: evidence.id,
                    candidateId: evidence.candidateId,
                    mutationFamily: "numeric-representation",
                    exportName: "increment",
                    parameterIndex: 0
                }
            ]
        });
        const automatic = suite.scenarios.find(scenario =>
            scenario.id.includes("auto:obligation:numeric")
        );
        const outcomes = await suite.preflight?.({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            ...preflightOracles
        });

        expect(outcomes?.[0]).toMatchObject({
            status: "blocked",
            reason: expect.stringContaining("wrong result for mutated input")
        });
    });

    test("uses the baseline verifier only for baseline arguments", async () => {
        const suite = createModuleSuite({
            name: "baseline-and-mutation-oracles",
            load: () =>
                Promise.resolve({ increment: (value: number) => value + 1 }),
            samples: {
                increment: [
                    {
                        label: "exact-baseline",
                        args: () => [1],
                        verify(result) {
                            if (result !== 2) {
                                throw new Error(
                                    "baseline verifier received mutated arguments"
                                );
                            }
                        },
                        verifyMutation: verifyIncrementMutation
                    }
                ]
            },
            evidence: [evidence],
            obligations: [
                {
                    id: "obligation:numeric",
                    evidenceId: evidence.id,
                    candidateId: evidence.candidateId,
                    mutationFamily: "numeric-representation",
                    exportName: "increment",
                    parameterIndex: 0
                }
            ]
        });
        const automatic = suite.scenarios.find(scenario =>
            scenario.id.includes("auto:obligation:numeric")
        );
        const outcomes = await suite.preflight?.({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            ...preflightOracles
        });

        expect(outcomes?.[0]).toMatchObject({
            status: "accepted",
            semanticVerification: "mutation-verified"
        });
    });

    test("records out-of-domain variants and measures only the accepted partition", async () => {
        let domainCalls = 0;
        const lerpEvidence = {
            ...evidence,
            id: "evidence:lerp",
            candidateId: "fixture.js#lerp@1",
            automation: {
                ...evidence.automation,
                parameterIndex: 2
            }
        };
        const suite = createModuleSuite({
            name: "mutation-domain",
            load: () =>
                Promise.resolve({
                    lerp: (start: number, end: number, amount: number) =>
                        (1 - amount) * start + amount * end
                }),
            samples: {
                lerp: [
                    {
                        label: "documented-domain",
                        args: () => [2, 10, 0.25],
                        verify(result) {
                            if (result !== 4) {
                                throw new Error("wrong baseline lerp result");
                            }
                        },
                        acceptMutation({ args }) {
                            domainCalls++;
                            const amount = args[2];
                            return typeof amount === "number" &&
                                Number.isFinite(amount) &&
                                amount >= 0 &&
                                amount <= 1
                                ? true
                                : "amount is outside [0, 1]";
                        },
                        verifyMutation({ args, result }) {
                            const [start, end, amount] = args as number[];
                            const expected =
                                (1 - amount) * start + amount * end;
                            if (!Object.is(result, expected)) {
                                throw new Error("wrong mutated lerp result");
                            }
                        }
                    }
                ]
            },
            evidence: [lerpEvidence],
            obligations: [
                {
                    id: "obligation:lerp",
                    evidenceId: lerpEvidence.id,
                    candidateId: lerpEvidence.candidateId,
                    mutationFamily: "numeric-representation",
                    exportName: "lerp",
                    parameterIndex: 2
                }
            ]
        });
        const automatic = suite.scenarios.find(scenario =>
            scenario.id.includes("auto:obligation:lerp")
        );
        const outcomes = await suite.preflight?.({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            ...preflightOracles
        });
        const outcome = outcomes?.[0];
        expect(outcome).toMatchObject({
            status: "accepted",
            mutationPlan: {
                stressVariants: [
                    "seed-number",
                    "fractional-double",
                    "negative-zero"
                ],
                excludedVariants: [
                    { variant: "nan", reason: "amount is outside [0, 1]" },
                    {
                        variant: "int32-overflow",
                        reason: "amount is outside [0, 1]"
                    },
                    {
                        variant: "uint32-overflow",
                        reason: "amount is outside [0, 1]"
                    }
                ]
            }
        });
        expect(domainCalls).toBe(6);

        const state = await suite.setup({
            runtime,
            inspect: false,
            scenarios: [automatic?.id as string],
            preflightOutcomes: outcomes ?? []
        });
        const measuredAmounts: number[] = [];
        if (automatic) {
            for (let iteration = 0; iteration < 4; iteration++) {
                // oxlint-disable-next-line no-await-in-loop -- The sequence proves accepted variants are replayed without re-running the domain hook.
                await automatic.run({
                    state,
                    phase: "stress",
                    iteration,
                    runtime,
                    invoke(_target, _receiver, args = []) {
                        const [start, end, amount] = args as number[];
                        measuredAmounts.push(amount);
                        return (1 - amount) * start + amount * end;
                    }
                });
            }
        }
        expect(domainCalls).toBe(6);
        expect(measuredAmounts).toEqual([1, 0.5, -0, 1]);
    });

    test("blocks an empty or failing mutation domain instead of fabricating evidence", async () => {
        for (const acceptMutation of [
            () => "no generated variant is valid",
            () => {
                throw new Error("domain oracle crashed");
            }
        ]) {
            const suite = createModuleSuite({
                name: "blocked-domain",
                load: () =>
                    Promise.resolve({
                        increment: (value: number) => value + 1
                    }),
                samples: {
                    increment: [
                        {
                            label: "seed",
                            args: () => [1],
                            acceptMutation,
                            verifyMutation: verifyIncrementMutation
                        }
                    ]
                },
                evidence: [evidence],
                obligations: [
                    {
                        id: "obligation:numeric",
                        evidenceId: evidence.id,
                        candidateId: evidence.candidateId,
                        mutationFamily: "numeric-representation",
                        exportName: "increment",
                        parameterIndex: 0
                    }
                ]
            });
            const automatic = suite.scenarios.find(scenario =>
                scenario.id.includes("auto:obligation:numeric")
            );
            // oxlint-disable-next-line no-await-in-loop -- Both exclusion and thrown-domain paths must terminate honestly.
            const outcomes = await suite.preflight?.({
                runtime,
                inspect: false,
                scenarios: [automatic?.id as string],
                ...preflightOracles
            });
            expect(outcomes?.[0].status).toBe("blocked");
        }
    });
});
