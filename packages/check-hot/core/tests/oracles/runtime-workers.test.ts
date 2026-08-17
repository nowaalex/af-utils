import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { runHotSuite } from "../../src/runner.js";
import { analyzeHotModule } from "../../src/analyzer.js";
import { readHotArtifactBundle } from "../../src/artifacts/index.js";
import {
    parseV8IcMapLog,
    supportedV8CodeCreationLocationTuples,
    supportsV8LogLayout
} from "../../src/runtime-oracles/v8-ic-maps/parse.js";
import type {
    HotV8CodeCreationLocation,
    RunHotSuiteOptions
} from "../../src/types.js";

const fixture = (name: string) =>
    fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

const runNode = (name: string, overrides: Partial<RunHotSuiteOptions> = {}) =>
    runHotSuite({
        suite: fixture(name),
        runtimes: ["node"],
        v8Tiers: ["turbofan"],
        modes: ["combined"],
        repetitions: 1,
        warmupIterations: 200,
        stressIterations: 20,
        deoptScope: "none",
        timeoutMs: 10_000,
        ...overrides
    });

const normalizeV8Status = (message: string) =>
    message.replace(/status=\d+/gu, "status=<runtime>");

const childProcessesAvailable =
    process.env.CODEX_PERMISSION_PROFILE === undefined &&
    spawnSync(
        process.execPath,
        [
            "--allow-natives-syntax",
            "--trace-opt",
            "--trace-deopt",
            "--trace-file-names",
            "-e",
            ""
        ],
        { stdio: "ignore" }
    ).status === 0;

test("rejects resolution-changing flags for an analyzer-generated suite", async () => {
    for (const argument of [
        "--conditions=development",
        "--experimental-loader=./redirect.mjs",
        "--require=./hook.cjs"
    ]) {
        // oxlint-disable-next-line no-await-in-loop -- Every independent resolution hook must be rejected before spawning a worker.
        await expect(
            runHotSuite({
                suite: fixture("runtime-analysis-contract.mjs"),
                runtimes: ["node"],
                runtimeArgs: { node: [argument] }
            })
        ).rejects.toThrow(/changes node module resolution/u);
    }
});

describe.runIf(childProcessesAvailable)(
    "real V8 worker negative controls",
    () => {
        test("accepts the known-good control and observes exact TurboFan", async () => {
            const summary = await runNode("runtime-pass.mjs");

            expect(summary.passed).toBe(true);
            expect(summary.runs[0].worker?.targets[0]).toMatchObject({
                engine: "v8",
                requestedTier: "turbofan",
                activeTier: "turbofan",
                optimized: true
            });
        });

        test("does not turn intentionally excluded obligations into blocked failures", async () => {
            const summary = await runNode("runtime-ignored-obligation.mjs");

            expect(summary.runs[0].coverage).toEqual([
                expect.objectContaining({
                    obligationId: "obligation:excluded",
                    status: "ignored"
                })
            ]);
            expect(summary.problems).toEqual([]);
            expect(summary.coverageComplete).toBe(true);
            expect(summary.passed).toBe(true);
        });

        test("collects target-scoped V8 and CPU diagnostics into an offline bundle", async () => {
            const parent = await mkdtemp(
                join(tmpdir(), "check-hot-real-diagnostics-")
            );
            const artifactOutput = join(parent, "bundle");
            const summary = await runNode("runtime-diagnostic-object.mjs", {
                warmupIterations: 2_000,
                stressIterations: 500,
                diagnostics: ["v8-ic-maps", "cpu-profile"],
                artifactOutput
            });

            expect(summary.passed).toBe(true);
            expect(
                summary.runs[0].diagnostics?.v8IcMaps?.graph.inlineCaches.every(
                    transition => transition.correlation === "name-only"
                )
            ).toBe(true);
            expect(
                summary.runs[0].diagnostics?.v8IcMaps?.graph.inlineCaches.some(
                    transition => transition.operation === "LoadIC"
                )
            ).toBe(true);
            expect(summary.runs[0].diagnostics?.cpuProfile).toBeDefined();
            const diagnosticStreams = new Set(
                summary.runs[0].events
                    .filter(event => event.purpose === "diagnostic")
                    .map(event => event.streamId)
            );
            expect(
                diagnosticStreams.has("diagnostic:v8-ic-maps:v8-worker")
            ).toBe(true);
            expect(
                diagnosticStreams.has("diagnostic:cpu-profile:v8-worker")
            ).toBe(true);
            expect(
                summary.runs[0].events.some(
                    event =>
                        event.streamId === "diagnostic:cpu-profile:v8-worker" &&
                        event.phase === "teardown" &&
                        event.kind === "phase-end"
                )
            ).toBe(true);
            const offline = await readHotArtifactBundle(artifactOutput);
            expect(offline.summary.passed).toBe(true);
            expect(
                offline.manifest.files.some(file =>
                    file.path.endsWith("diagnostics/v8.log")
                )
            ).toBe(true);
            expect(
                offline.manifest.files.some(file =>
                    file.path.endsWith("diagnostics/cpu.cpuprofile")
                )
            ).toBe(true);
        });

        test("keeps a diagnostic-only crash advisory and preserves the primary verdict", async () => {
            const baseline = await runNode("runtime-diagnostic-crash.mjs");
            const diagnosed = await runNode("runtime-diagnostic-crash.mjs", {
                diagnostics: ["cpu-profile"]
            });

            expect(baseline.passed).toBe(true);
            expect(diagnosed.passed).toBe(true);
            expect(diagnosed.runs[0].diagnostics?.cpuProfile?.gap).toContain(
                "intentional diagnostic-only crash"
            );
            expect({
                passed: diagnosed.runs[0].passed,
                coverage: diagnosed.runs[0].coverage,
                targets: diagnosed.runs[0].worker?.targets,
                deoptimizations: diagnosed.runs[0].deoptimizations
            }).toEqual({
                passed: baseline.runs[0].passed,
                coverage: baseline.runs[0].coverage,
                targets: baseline.runs[0].worker?.targets,
                deoptimizations: baseline.runs[0].deoptimizations
            });
        });

        test("parses diagnostics for a tier-failing target without changing primary evidence", async () => {
            const primary = await runNode("runtime-diagnostic-object.mjs", {
                runtimeArgs: { node: ["--no-turbofan"] }
            });
            const diagnosed = await runNode("runtime-diagnostic-object.mjs", {
                runtimeArgs: { node: ["--no-turbofan"] },
                diagnostics: ["v8-ic-maps", "cpu-profile"]
            });

            expect(diagnosed.runs[0].passed).toBe(false);
            expect(
                diagnosed.runs[0].diagnostics?.v8IcMaps?.graph.inlineCaches
                    .length
            ).toBeGreaterThan(0);
            expect(diagnosed.runs[0].diagnostics?.cpuProfile).toBeDefined();
            expect(
                diagnosed.runs[0].diagnostics?.problems?.some(
                    problem => problem.problemId === "v8-tier-mismatch"
                )
            ).toBe(true);
            expect(
                diagnosed.runs[0].diagnostics?.problems?.filter(
                    problem => problem.problemId === "v8-tier-mismatch"
                )
            ).toHaveLength(1);
            expect({
                passed: diagnosed.runs[0].passed,
                coverage: diagnosed.runs[0].coverage,
                problems: diagnosed.runs[0].problems.map(problem => ({
                    ...problem,
                    message: normalizeV8Status(problem.message)
                })),
                deoptimizations: diagnosed.runs[0].deoptimizations
            }).toEqual({
                passed: primary.runs[0].passed,
                coverage: primary.runs[0].coverage,
                problems: primary.runs[0].problems.map(problem => ({
                    ...problem,
                    message: normalizeV8Status(problem.message)
                })),
                deoptimizations: primary.runs[0].deoptimizations
            });
        });

        test("finishes every primary cell before starting advisory reruns", async () => {
            const directory = await mkdtemp(
                join(tmpdir(), "check-hot-order-control-")
            );
            const orderFile = join(directory, "order.log");
            const suiteFile = join(directory, "suite.mjs");
            await writeFile(
                suiteFile,
                [
                    'import { appendFileSync } from "node:fs";',
                    "const hot = value => value.x;",
                    'const target = { id: "hot", annotation: false, resolve: state => state.hot };',
                    "export default {",
                    '  name: "two-phase-order",',
                    `  setup() { const request = JSON.parse(process.argv.at(-1)); appendFileSync(${JSON.stringify(orderFile)}, request.purpose + ":" + (request.diagnostic ?? "primary") + ":" + request.stressIterations + "\\n"); return { hot, value: { x: 1 } }; },`,
                    '  scenarios: [{ id: "read", targets: [target], run({ state, invoke }) { invoke(target, undefined, [state.value]); } }] ',
                    "};"
                ].join("\n")
            );
            try {
                const summary = await runHotSuite({
                    suite: suiteFile,
                    runtimes: ["node"],
                    v8Tiers: ["turbofan"],
                    modes: ["combined"],
                    repetitions: 2,
                    concurrency: 2,
                    warmupIterations: 500,
                    stressIterations: 50,
                    deoptScope: "none",
                    diagnostics: ["cpu-profile"],
                    diagnosticStressIterations: { "cpu-profile": 75 },
                    timeoutMs: 10_000
                });
                expect(summary.runs).toHaveLength(2);
                expect(
                    (await readFile(orderFile, "utf8")).trim().split("\n")
                ).toEqual([
                    "measurement:primary:50",
                    "measurement:primary:50",
                    "diagnostic:cpu-profile:75",
                    "diagnostic:cpu-profile:75"
                ]);
            } finally {
                await rm(directory, { recursive: true, force: true });
            }
        });

        test("rejects a scenario that calls the wrong target path", async () => {
            const summary = await runNode("runtime-wrong-invocation.mjs");

            expect(summary.passed).toBe(false);
            expect(
                summary.runs[0].problems
                    .map(problem => problem.message)
                    .join("\n")
            ).toContain("was not invoked during warmup");
        });

        test("rejects a target reached in warmup but not guarded stress", async () => {
            const summary = await runNode("runtime-warmup-only.mjs");

            expect(summary.passed).toBe(false);
            expect(
                summary.runs[0].problems
                    .map(problem => problem.message)
                    .join("\n")
            ).toContain("was not invoked during stress");
        });

        test("rejects a final tier different from the requested tier", async () => {
            const summary = await runNode("runtime-pass.mjs", {
                runtimeArgs: { node: ["--no-turbofan"] }
            });

            expect(summary.passed).toBe(false);
            expect(
                summary.runs[0].problems
                    .map(problem => problem.message)
                    .join("\n")
            ).toContain("requested turbofan");
        });

        test("detects wrong maps and array elements kinds with native probes", async () => {
            const summary = await runNode("runtime-wrong-representations.mjs");
            const messages = summary.runs[0].problems
                .map(problem => problem.message)
                .join("\n");

            expect(summary.passed).toBe(false);
            expect(messages).toContain("wrong map detected");
            expect(messages).toContain("wrong elements kind detected");
        });

        test("rejects a deopt even when V8 can reoptimize afterward", async () => {
            const summary = await runNode("runtime-deopt.mjs", {
                deoptScope: "all"
            });

            expect(summary.passed).toBe(false);
            expect(summary.runs[0].deoptimizations.length).toBeGreaterThan(0);
        });

        test("defaults to target-scoped deopts and ignores harness/helper churn", async () => {
            const targetScoped = await runNode("runtime-nontarget-deopt.mjs", {
                deoptScope: undefined
            });
            const allFunctions = await runNode("runtime-nontarget-deopt.mjs", {
                deoptScope: "all"
            });

            expect(targetScoped.passed).toBe(true);
            expect(targetScoped.runs[0].deoptimizations).toEqual([]);
            expect(allFunctions.passed).toBe(false);
            expect(allFunctions.runs[0].deoptimizations.join("\n")).toContain(
                "helperVictim"
            );
        });

        test("does not attribute a warmup-only deopt to guarded stress", async () => {
            const summary = await runNode("runtime-warmup-deopt.mjs", {
                deoptScope: "all"
            });

            expect(summary.passed).toBe(true);
            expect(summary.runs[0].deoptimizations).toEqual([]);
            expect(summary.runs[0].stdout).toContain("warmupVictim");
        });

        test("kills a worker at the hard timeout", async () => {
            const summary = await runNode("runtime-timeout.mjs", {
                timeoutMs: 500
            });

            expect(summary.passed).toBe(false);
            expect(
                summary.runs[0].problems
                    .map(problem => problem.message)
                    .join("\n")
            ).toContain("exceeded the 500ms timeout");
        });

        test("rejects a second forged terminal worker result", async () => {
            const summary = await runNode("runtime-forged-result.mjs");

            expect(summary.passed).toBe(false);
            expect(
                summary.runs[0].problems.map(problem => problem.problemId)
            ).toContain("runtime-worker-result-invalid");
            expect(summary.runs[0].stdout).toContain(
                "intentional real failure"
            );
        });

        test("accounts for every obligation when disposable preflight crashes", async () => {
            const summary = await runNode("runtime-preflight-crash.mjs");

            expect(summary.passed).toBe(false);
            expect(summary.runs[0].coverage).toEqual([
                expect.objectContaining({
                    obligationId: "obligation:preflight-crash",
                    status: "failed",
                    reason: expect.stringContaining(
                        "Semantic preflight process failed"
                    )
                })
            ]);
            expect(
                summary.runs[0].problems
                    .map(problem => problem.message)
                    .join("\n")
            ).toContain("intentional preflight crash");
        });

        test("never reports complete coverage for an accepted incomplete graph", async () => {
            const summary = await runNode("runtime-incomplete-graph.mjs");

            expect(summary.runs[0].passed).toBe(true);
            expect(summary.coverageComplete).toBe(false);
            expect(summary.passed).toBe(false);
            expect(
                summary.problems
                    .flatMap(problem => [problem.message, problem.detail])
                    .filter(Boolean)
                    .join("\n")
            ).toContain("fixture has one unresolved edge");
        });

        test("does not close an obligation when its AST branch was not reached", async () => {
            const summary = await runNode("runtime-site-not-reached.ts");
            const coverage = summary.runs[0].worker?.coverage[0];

            expect(summary.passed).toBe(false);
            expect(coverage).toMatchObject({
                status: "blocked",
                preflight: { siteHitCount: 0 }
            });
            expect(coverage?.reason).toContain(
                "did not each reach exact AST evidence"
            );
        });

        test("closes an obligation only after guarded lifecycle site coverage", async () => {
            const summary = await runNode("runtime-site-reached.ts");
            const coverage = summary.runs[0].worker?.coverage[0];

            expect(summary.passed).toBe(true);
            expect(coverage).toMatchObject({ status: "passed" });
            expect(
                coverage?.preflight?.mutationPlan?.observations
                    .filter(
                        observation =>
                            observation.variant !== "adapter-baseline"
                    )
                    .every(
                        observation =>
                            (observation.guardedSiteHitCount ?? 0) > 0
                    )
            ).toBe(true);
        });

        test("does not reuse preflight-only site evidence after warmup changes state", async () => {
            const summary = await runNode("runtime-stateful-site.ts");
            const coverage = summary.runs[0].worker?.coverage[0];

            expect(summary.passed).toBe(false);
            expect(coverage).toMatchObject({ status: "blocked" });
            expect(
                coverage?.preflight?.mutationPlan?.observations
                    .filter(
                        observation =>
                            observation.variant !== "adapter-baseline"
                    )
                    .some(
                        observation =>
                            (observation.guardedSiteHitCount ?? 0) === 0
                    )
            ).toBe(true);
            expect(coverage?.reason).toContain(
                "did not each reach exact AST evidence during guarded stress"
            );
        });
    },
    30_000
);

const denoAvailable =
    childProcessesAvailable &&
    spawnSync("deno", ["--version"], { stdio: "ignore" }).status === 0;
const bunAvailable =
    childProcessesAvailable &&
    spawnSync("bun", ["--version"], { stdio: "ignore" }).status === 0;
const requiredRuntimes = new Set(
    process.env.CHECK_HOT_REQUIRE_RUNTIMES?.split(",").filter(Boolean) ?? []
);

const v8LocationTuple = (location?: HotV8CodeCreationLocation) =>
    [
        location?.syntaxKind,
        location?.anchor,
        location?.async,
        location?.generator,
        location?.static,
        location?.computed
    ].join(":");

const assertV8LocatorControl = async (
    runtime: "node" | "deno",
    engineVersion: string
) => {
    const source = fixture("runtime-v8-locator-shapes.mjs");
    const report = await analyzeHotModule({ input: source, runtime });
    const candidates = report.candidates.filter(
        candidate =>
            candidate.name.startsWith("controlled") &&
            candidate.runtimeLocations?.v8CodeCreation
    );
    const sourceSha256 = createHash("sha256")
        .update(await readFile(source))
        .digest("hex");
    expect(
        candidates.every(
            candidate =>
                candidate.runtimeLocations?.v8CodeCreation?.sourceSha256 ===
                sourceSha256
        )
    ).toBe(true);
    expect(
        new Set(
            candidates.map(
                candidate =>
                    candidate.runtimeLocations?.v8CodeCreation?.syntaxKind
            )
        )
    ).toEqual(
        new Set([
            "FunctionDeclaration",
            "FunctionExpression",
            "ArrowFunctionExpression",
            "ObjectMethod",
            "ObjectGetter",
            "ObjectSetter",
            "ClassMethod",
            "ClassGetter",
            "ClassSetter"
        ])
    );
    expect(
        new Set(
            candidates.map(candidate =>
                v8LocationTuple(candidate.runtimeLocations?.v8CodeCreation)
            )
        )
    ).toEqual(supportedV8CodeCreationLocationTuples);
    expect(
        report.evidence.some(
            evidence =>
                evidence.runtimeLocations?.v8CodeCreation?.sourceSha256 ===
                sourceSha256
        )
    ).toBe(true);
    const directory = await mkdtemp(join(tmpdir(), "check-hot-v8-locator-"));
    const logfile = join(directory, "v8.log");
    const flags = [
        "--log-ic",
        `--logfile=${logfile}`,
        "--no-logfile-per-isolate"
    ];
    const execution =
        runtime === "node"
            ? spawnSync(process.execPath, [...flags, source], {
                  encoding: "utf8"
              })
            : spawnSync(
                  "deno",
                  [
                      "run",
                      "--allow-read",
                      `--v8-flags=${flags.join(",")}`,
                      source
                  ],
                  { encoding: "utf8" }
              );
    try {
        expect(execution.status, execution.stderr).toBe(0);
        const parsed = parseV8IcMapLog(
            await readFile(logfile, "utf8"),
            engineVersion,
            `control:${runtime}:v8-code-creation`,
            candidates.map(candidate => ({
                targetId: candidate.id,
                functionName: candidate.name,
                sourceFile: candidate.file,
                runtimeLocation: candidate.runtimeLocations?.v8CodeCreation
            }))
        );
        expect(candidates).toHaveLength(29);
        expect(parsed.targetScope.unmatchedTargetIds).toEqual([]);
        expect(parsed.targetScope.ambiguousTargetIds).toEqual([]);
        expect(parsed.targetScope.matchedTargetIds.toSorted()).toEqual(
            candidates.map(candidate => candidate.id).toSorted()
        );
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
};

test("provides every runtime control required by CI", () => {
    const availability = {
        node: childProcessesAvailable,
        deno: denoAvailable,
        bun: bunAvailable
    };
    for (const runtime of requiredRuntimes) {
        expect(
            availability[runtime as keyof typeof availability],
            `${runtime} was required, but its real engine control could not start`
        ).toBe(true);
    }
});

test.runIf(childProcessesAvailable && supportsV8LogLayout(process.versions.v8))(
    "matches analyzer-derived code-creation locators on the registered Node V8",
    () => assertV8LocatorControl("node", process.versions.v8),
    30_000
);

test.runIf(denoAvailable)(
    "runs Deno with only declared read/environment permissions",
    async () => {
        const before = process.env.CHECK_HOT_FIXTURE;
        const summary = await runHotSuite({
            suite: fixture("environment-suite.mjs"),
            runtimes: ["deno"],
            v8Tiers: ["turbofan"],
            modes: ["combined"],
            repetitions: 1,
            warmupIterations: 100,
            stressIterations: 20,
            deoptScope: "none",
            timeoutMs: 10_000
        });

        expect(summary.passed).toBe(true);
        expect(process.env.CHECK_HOT_FIXTURE).toBe(before);
        expect(
            summary.runs[0].command.some(
                argument =>
                    argument.startsWith("--allow-env=") &&
                    argument.includes("CHECK_HOT_FIXTURE") &&
                    argument.includes("NAPI_RS_WASI_FLAVOR")
            )
        ).toBe(true);
    },
    30_000
);

test.runIf(denoAvailable)(
    "matches analyzer-derived code-creation locators on the registered Deno V8",
    async () => {
        const version = spawnSync(
            "deno",
            ["eval", "console.log(Deno.version.v8)"],
            { encoding: "utf8" }
        ).stdout.trim();
        if (!supportsV8LogLayout(version)) return;
        await assertV8LocatorControl("deno", version);
    },
    30_000
);

test.runIf(denoAvailable)(
    "collects a target-scoped V8 IC log through real Deno",
    async () => {
        const summary = await runHotSuite({
            suite: fixture("runtime-diagnostic-object.mjs"),
            runtimes: ["deno"],
            v8Tiers: ["turbofan"],
            modes: ["combined"],
            repetitions: 1,
            warmupIterations: 2_000,
            stressIterations: 500,
            deoptScope: "none",
            diagnostics: ["v8-ic-maps"],
            timeoutMs: 20_000
        });

        expect(summary.runs[0].diagnostics?.v8IcMaps?.gap).toBeUndefined();
        expect(
            summary.runs[0].diagnostics?.v8IcMaps?.graph.inlineCaches.some(
                transition =>
                    transition.operation === "LoadIC" &&
                    transition.targetId === "readPoint"
            )
        ).toBe(true);
    },
    30_000
);

test.runIf(denoAvailable)(
    "ranks authenticated sustained target work in Deno's CPU profile",
    async () => {
        const summary = await runHotSuite({
            suite: fixture("runtime-sampling-busy.mjs"),
            runtimes: ["deno"],
            v8Tiers: ["turbofan"],
            modes: ["combined"],
            repetitions: 1,
            warmupIterations: 1_000,
            stressIterations: 500,
            deoptScope: "none",
            diagnostics: ["cpu-profile"],
            timeoutMs: 30_000
        });
        const profile = summary.runs[0].diagnostics?.cpuProfile;

        expect(profile?.gap).toBeUndefined();
        expect(profile?.totalSamples).toBeGreaterThan(0);
        expect(
            profile?.functions.some(
                entry => entry.candidateId === "candidate:busy-compute"
            )
        ).toBe(true);
    },
    45_000
);

test.runIf(bunAvailable)(
    "runs the known-good control through Bun/JSC's public oracle",
    async () => {
        const summary = await runHotSuite({
            suite: fixture("runtime-sampling-busy.mjs"),
            runtimes: ["bun"],
            modes: ["combined"],
            repetitions: 1,
            warmupIterations: 1_000,
            stressIterations: 500,
            deoptScope: "none",
            timeoutMs: 30_000
        });

        expect(summary.passed).toBe(true);
        expect(summary.runs[0].worker?.targets[0]).toMatchObject({
            engine: "jsc",
            compiledHistorically: true,
            currentTier: "not-observable"
        });
    },
    45_000
);

test.runIf(bunAvailable)(
    "collects Bun's public JSC sampling profile during sustained target work",
    async () => {
        const summary = await runHotSuite({
            suite: fixture("runtime-sampling-busy.mjs"),
            runtimes: ["bun"],
            modes: ["combined"],
            repetitions: 1,
            warmupIterations: 1_000,
            stressIterations: 500,
            deoptScope: "none",
            diagnostics: ["jsc-sampling"],
            timeoutMs: 30_000
        });
        const sampling = summary.runs[0].diagnostics?.jscSampling;

        expect(sampling).toBeDefined();
        expect(sampling?.gap).toBeUndefined();
        expect(sampling?.totalSamples).toBeGreaterThan(0);
        expect(Object.keys(sampling?.tiers ?? {})).not.toHaveLength(0);
        expect(sampling?.stackTraceCount).toBeGreaterThan(0);
        expect(sampling?.stackTraces.length).toBeGreaterThan(0);
    },
    45_000
);
