import { createHash } from "node:crypto";
import {
    lstat,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    rm,
    symlink,
    writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import {
    beginHotArtifactBundle,
    assertHotArtifactOutputPaths,
    finalizeHotArtifactBundle,
    hotArtifactRunPath,
    isHotArtifactRelativePath,
    isUnchangedHotArtifactFile,
    normalizeHotArtifactPath,
    readHotArtifactBundle,
    type HotArtifactManifest
} from "./index.js";
import type { HotRunResult, HotRunSummary, HotSuite } from "../types.js";

const directories: string[] = [];

afterEach(async () => {
    await Promise.all(
        directories
            .splice(0)
            .map(directory => rm(directory, { recursive: true, force: true }))
    );
});

const temporaryOutput = async (label: string) => {
    const parent = await mkdtemp(join(tmpdir(), `check-hot-${label}-`));
    directories.push(parent);
    return join(parent, "bundle");
};

const run = (overrides: Partial<HotRunResult> = {}): HotRunResult => ({
    runtime: "node",
    tier: "turbofan",
    mode: "combined",
    scenarios: ["scenario"],
    repetition: 1,
    durationMs: 10,
    passed: true,
    coverage: [],
    deoptimizations: [],
    problems: [],
    stdout: "stdout control\n",
    stderr: "stderr control\n",
    command: ["node", "worker.js", "secret-in-argument"],
    events: [
        {
            sequence: 0,
            streamId: "measurement:v8",
            purpose: "measurement",
            phase: "setup",
            kind: "phase-start",
            source: "worker-lifecycle",
            correlation: "phase",
            message: "started"
        }
    ],
    ...overrides
});

const suite = {
    name: "artifact-test",
    setup: () => ({}),
    scenarios: []
} satisfies HotSuite<object>;

const summary = (runs: readonly HotRunResult[] = []): HotRunSummary => ({
    suite: "artifact-test",
    runs,
    problems: [],
    coverageComplete: true,
    passed: true
});

const readManifest = async (output: string) =>
    JSON.parse(
        await readFile(join(output, "manifest.json"), "utf8")
    ) as HotArtifactManifest;

const writeManifest = (output: string, value: HotArtifactManifest) =>
    writeFile(
        join(output, "manifest.json"),
        `${JSON.stringify(value, null, 2)}\n`
    );

const authenticateReplacement = async (
    output: string,
    path: string,
    value: unknown
) => {
    const content = `${JSON.stringify(value, null, 2)}\n`;
    await writeFile(join(output, path), content);
    const manifest = await readManifest(output);
    await writeManifest(output, {
        ...manifest,
        files: manifest.files.map(file =>
            file.path === path
                ? {
                      path,
                      bytes: Buffer.byteLength(content),
                      sha256: createHash("sha256").update(content).digest("hex")
                  }
                : file
        )
    });
};

describe("artifact bundle", () => {
    test("requires every regular-file identity field to stay stable while hashing", () => {
        const identity = {
            isFile: () => true,
            isSymbolicLink: () => false,
            dev: 1,
            ino: 2,
            size: 3,
            mtimeMs: 4
        };
        expect(isUnchangedHotArtifactFile(identity, identity)).toBe(true);
        for (const changed of [
            { ...identity, isFile: () => false },
            { ...identity, isSymbolicLink: () => true },
            { ...identity, dev: 5 },
            { ...identity, ino: 5 },
            { ...identity, size: 5 },
            { ...identity, mtimeMs: 5 }
        ]) {
            expect(isUnchangedHotArtifactFile(identity, changed)).toBe(false);
        }
    });

    test("publishes and hydrates a lean two-run bundle without importing the suite", async () => {
        const output = await temporaryOutput("artifact-roundtrip");
        const workspace = await beginHotArtifactBundle(output);
        const runtime = {
            name: "node" as const,
            version: "26.7.0",
            engine: "v8" as const,
            engineVersion: "14.2",
            tier: "turbofan" as const,
            oracleId: "v8-native-intrinsics",
            oracleVersion: "1" as const
        } as const;
        const selectedCoverage = {
            obligationId: "obligation:shape",
            status: "blocked" as const,
            reason: "no accepted candidate",
            scenarios: [] as const,
            evidence: {
                id: "evidence:shape",
                rule: "shape-mutation",
                candidateId: "candidate:shape",
                confidence: "dataflow-proven" as const,
                subject: "shape branch",
                span: {
                    file: "/workspace/shape.js",
                    relativeFile: "shape.js",
                    sourceSha256: "a".repeat(64),
                    start: 10,
                    end: 11,
                    line: 1,
                    column: 11,
                    endLine: 1,
                    endColumn: 12
                },
                ownerSpan: {
                    file: "/workspace/shape.js",
                    relativeFile: "shape.js",
                    sourceSha256: "a".repeat(64),
                    start: 0,
                    end: 20,
                    line: 1,
                    column: 1,
                    endLine: 1,
                    endColumn: 21
                },
                runtimeLocations: {
                    v8CodeCreation: {
                        schemaVersion: 1 as const,
                        sourceSha256: "a".repeat(64),
                        line: 1,
                        column: 9,
                        anchor: "parameter-list-start" as const,
                        syntaxKind: "FunctionExpression" as const,
                        async: false,
                        generator: false,
                        static: false,
                        computed: false
                    }
                }
            },
            preflight: {
                obligationId: "obligation:shape",
                scenarioId: "shape:auto:obligation:shape",
                sampleId: "shape:branch-seed",
                evidenceId: "evidence:shape",
                mutationFamily: "object-shape" as const,
                status: "blocked" as const,
                semanticVerification: "mutation-verified" as const
            }
        };
        const runs = [
            run({
                coverage: [selectedCoverage],
                worker: {
                    suite: "artifact-test",
                    runtime,
                    scenarios: ["scenario"],
                    targets: [],
                    checks: [],
                    invocations: {},
                    coverage: [selectedCoverage],
                    problems: [],
                    events: []
                }
            }),
            run({
                repetition: 2,
                scenarios: ["other"],
                stdout: "second stdout",
                stderr: "second stderr",
                command: ["node", "second.js"],
                events: [],
                worker: {
                    suite: "artifact-test",
                    runtime,
                    scenarios: ["other"],
                    targets: [],
                    checks: [],
                    invocations: {},
                    coverage: [],
                    problems: [],
                    events: []
                }
            })
        ];
        const finalized = await finalizeHotArtifactBundle(
            workspace,
            summary(runs),
            suite
        );

        const loaded = await readHotArtifactBundle(output);
        expect(finalized.artifactSchemaVersion).toBe("1");
        expect(loaded.summary.artifactSchemaVersion).toBe("1");
        expect(loaded.summary.runs.map(item => item.stdout)).toEqual([
            "stdout control\n",
            "second stdout"
        ]);
        expect(loaded.summary.runs[0].coverage[0]?.preflight?.sampleId).toBe(
            "shape:branch-seed"
        );
        expect(
            loaded.summary.runs[0].coverage[0]?.evidence?.runtimeLocations
                ?.v8CodeCreation
        ).toMatchObject({
            schemaVersion: 1,
            sourceSha256: "a".repeat(64),
            line: 1,
            column: 9,
            syntaxKind: "FunctionExpression"
        });
        expect(loaded.summary.runs[0].command).toEqual([
            "node",
            "worker.js",
            "secret-in-argument"
        ]);
        expect(loaded.summary.runs[0].events).toEqual(runs[0].events);
        const paths = loaded.manifest.files.map(file => file.path);
        expect(paths).toContain("summary.json");
        for (const suffix of [
            "stdout.log",
            "stderr.log",
            "command.json",
            "events.json"
        ]) {
            expect(paths.some(path => path.endsWith(suffix))).toBe(true);
        }
        expect(loaded.manifest.runtimeOracles).toEqual([
            {
                runtime: "node",
                runtimeVersion: "26.7.0",
                engine: "v8",
                engineVersion: "14.2",
                oracleId: "v8-native-intrinsics",
                oracleVersion: "1"
            }
        ]);
        expect(loaded.manifest.checkHotVersion).toMatch(/^\d+\.\d+\.\d+/u);
        expect(loaded.manifest.configuredEnvironmentValuesIncluded).toBe(false);
        const lean = JSON.parse(
            await readFile(join(output, "summary.json"), "utf8")
        ) as HotRunSummary;
        expect(lean.runs[0]).toMatchObject({
            stdout: "",
            stderr: "",
            command: [],
            events: []
        });
        expect(
            (await readHotArtifactBundle(join(output, "manifest.json"))).root
        ).toBe(output);
    });

    test("stages outside the destination and publishes only at finalization", async () => {
        const output = await temporaryOutput("artifact-staging");
        const workspace = await beginHotArtifactBundle(output);
        expect(workspace.staging.startsWith(dirname(output))).toBe(false);
        await expect(lstat(output)).rejects.toThrow();

        await finalizeHotArtifactBundle(workspace, summary(), suite);
        expect((await lstat(output)).isDirectory()).toBe(true);
        await expect(lstat(workspace.staging)).rejects.toThrow();
        expect(await readdir(dirname(output))).toEqual(["bundle"]);
    });

    test("refuses to overwrite an existing evidence directory", async () => {
        const output = await mkdtemp(join(tmpdir(), "check-hot-existing-"));
        directories.push(output);
        await expect(beginHotArtifactBundle(output)).rejects.toThrow(
            "already exists"
        );
    });

    test("validates disjoint JSON and artifact outputs in both directions", () => {
        expect(() =>
            assertHotArtifactOutputPaths("/tmp/same", "/tmp/same")
        ).toThrow("must be disjoint");
        expect(() => assertHotArtifactOutputPaths("/tmp/bundle")).not.toThrow();
        expect(() =>
            assertHotArtifactOutputPaths("/tmp/bundle", "/tmp/result.json")
        ).not.toThrow();
        expect(() =>
            assertHotArtifactOutputPaths("/tmp/bundle", "/tmp/bundle-other")
        ).not.toThrow();
        expect(() =>
            assertHotArtifactOutputPaths(
                "/tmp/bundle",
                "/tmp/bundle/result.json"
            )
        ).toThrow("must be disjoint");
        expect(() =>
            assertHotArtifactOutputPaths("/tmp/output/artifacts", "/tmp/output")
        ).toThrow("must be disjoint");
    });

    test("detects disjointness through an existing symlinked parent", async () => {
        const parent = await mkdtemp(join(tmpdir(), "check-hot-alias-"));
        directories.push(parent);
        const real = join(parent, "real");
        const alias = join(parent, "alias");
        await mkdir(real);
        await symlink(real, alias, "dir");

        expect(() =>
            assertHotArtifactOutputPaths(
                join(real, "bundle"),
                join(alias, "bundle", "result.json")
            )
        ).toThrow("must be disjoint");
    });

    test("normalizes and validates portable relative artifact paths", () => {
        expect(normalizeHotArtifactPath("cell\\nested\\stdout.log")).toBe(
            "cell/nested/stdout.log"
        );
        for (const accepted of ["summary.json", "cell/run/stdout.log"]) {
            expect(isHotArtifactRelativePath(accepted)).toBe(true);
        }
        for (const rejected of [
            "",
            "/absolute",
            "C:/absolute",
            "../outside",
            "cell/../outside",
            "cell/./file",
            "cell\\file",
            "summary.json:payload",
            "cell//file",
            "cell/"
        ]) {
            expect(isHotArtifactRelativePath(rejected)).toBe(false);
        }
    });

    test("cleans OS staging when bundle preparation fails", async () => {
        const output = await temporaryOutput("artifact-preparation-failure");
        const workspace = await beginHotArtifactBundle(output);
        await expect(
            finalizeHotArtifactBundle(
                workspace,
                summary([run({ stdout: undefined as unknown as string })]),
                suite
            )
        ).rejects.toThrow(/data/iu);
        await expect(lstat(workspace.staging)).rejects.toThrow();
        await expect(lstat(output)).rejects.toThrow();
    });

    test("uses every matrix coordinate in a stable collision-resistant run path", () => {
        const baseline = run();
        const path = hotArtifactRunPath(baseline);
        expect(path).toMatch(
            /^node\/turbofan\/combined\/cell-[a-f\d]{20}-run-1$/u
        );
        expect(hotArtifactRunPath({ ...baseline })).toBe(path);
        for (const changed of [
            { ...baseline, runtime: "deno" as const },
            { ...baseline, tier: "maglev" as const },
            { ...baseline, mode: "isolated" as const },
            { ...baseline, scenarios: ["../hostile", "other"] },
            { ...baseline, repetition: 2 }
        ]) {
            expect(hotArtifactRunPath(changed)).not.toBe(path);
        }
        expect(
            hotArtifactRunPath({ ...baseline, scenarios: ["../hostile"] })
        ).not.toContain("hostile");
    });

    test("rejects changed bytes and changed size", async () => {
        const output = await temporaryOutput("artifact-tamper");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        await writeFile(join(output, "summary.json"), "{}\n");
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "integrity mismatch"
        );
    });

    test("checks declared byte size and SHA-256 independently", async () => {
        const output = await temporaryOutput("artifact-forged-inventory");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        const original = await readManifest(output);
        const summaryFile = original.files.find(
            file => file.path === "summary.json"
        ) as HotArtifactManifest["files"][number];
        await writeManifest(output, {
            ...original,
            files: original.files.map(file =>
                file.path === "summary.json"
                    ? { ...file, bytes: file.bytes + 1 }
                    : file
            )
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "integrity mismatch"
        );
        await writeManifest(output, {
            ...original,
            files: original.files.map(file =>
                file.path === "summary.json"
                    ? Object.assign({}, file, { sha256: "0".repeat(64) })
                    : file
            )
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "integrity mismatch"
        );
        expect(summaryFile.sha256).toHaveLength(64);
    });

    test("rejects unsafe, duplicate, and escaping manifest paths before reading them", async () => {
        const output = await temporaryOutput("artifact-paths");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        const original = await readManifest(output);
        for (const path of [
            "",
            "/absolute",
            "..",
            "../outside",
            "cell/../../outside",
            "cell/./file",
            "cell//file",
            "cell/",
            "cell\\file"
        ]) {
            // oxlint-disable-next-line no-await-in-loop -- Every hostile manifest spelling is a distinct trust-boundary control.
            await writeManifest(output, {
                ...original,
                files: [
                    ...original.files,
                    { path, bytes: 0, sha256: "0".repeat(64) }
                ]
            });
            // oxlint-disable-next-line no-await-in-loop -- The reader must reject each spelling before filesystem traversal.
            await expect(readHotArtifactBundle(output)).rejects.toThrow(
                "Unsafe or duplicate artifact path"
            );
        }
        await writeManifest(output, {
            ...original,
            files: [...original.files, original.files[0]]
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "Unsafe or duplicate artifact path"
        );
    });

    test("rejects a directory declared as an artifact file", async () => {
        const output = await temporaryOutput("artifact-directory");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        await mkdir(join(output, "declared-directory"));
        const manifest = await readManifest(output);
        await writeManifest(output, {
            ...manifest,
            files: [
                ...manifest.files,
                {
                    path: "declared-directory",
                    bytes: 0,
                    sha256: "0".repeat(64)
                }
            ]
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "not a regular file"
        );
    });

    test("rejects undeclared and symbolic-link filesystem entries", async () => {
        const output = await temporaryOutput("artifact-inventory");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        await writeFile(join(output, "undeclared.txt"), "extra");
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "undeclared files"
        );
        await rm(join(output, "undeclared.txt"));
        await symlink("summary.json", join(output, "undeclared-link"));
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "unsupported filesystem entry"
        );
    });

    test("rejects a declared file replaced with a symlink", async () => {
        const output = await temporaryOutput("artifact-declared-link");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary([run()]), suite);
        const artifact = (await readHotArtifactBundle(output)).summary.runs[0]
            .artifacts?.stdout as string;
        await rm(join(output, artifact));
        await symlink(join(output, "summary.json"), join(output, artifact));
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "not a regular file"
        );
    });

    test("rejects a symbolic-link manifest before parsing it", async () => {
        const output = await temporaryOutput("artifact-manifest-link");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        const manifest = await readFile(join(output, "manifest.json"));
        await writeFile(join(output, "manifest-copy.json"), manifest);
        await rm(join(output, "manifest.json"));
        await symlink("manifest-copy.json", join(output, "manifest.json"));
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "manifest is not a regular file"
        );
        await expect(
            readHotArtifactBundle(join(output, "manifest.json"))
        ).rejects.toThrow(
            "Artifact input must be a bundle directory or its regular manifest.json"
        );
    });

    test("rejects a manifest path that resolves to a directory", async () => {
        const output = await temporaryOutput(
            "artifact-manifest-directory-entry"
        );
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        await rm(join(output, "manifest.json"));
        await mkdir(join(output, "manifest.json"));

        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "Artifact manifest is not a regular file"
        );
    });

    test("distinguishes a bundle directory named manifest.json from the manifest file", async () => {
        const parent = await mkdtemp(
            join(tmpdir(), "check-hot-manifest-directory-")
        );
        directories.push(parent);
        const output = join(parent, "manifest.json");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);

        expect((await readHotArtifactBundle(output)).root).toBe(output);
        const ordinaryFile = join(parent, "other.json");
        await writeFile(ordinaryFile, "{}\n");
        await expect(readHotArtifactBundle(ordinaryFile)).rejects.toThrow(
            "bundle directory or its regular manifest.json"
        );
    });

    test("hydrates unicode logs and an unknown engine version exactly", async () => {
        const output = await temporaryOutput("artifact-unicode");
        const workspace = await beginHotArtifactBundle(output);
        const runtime = {
            name: "node" as const,
            version: "26.7.0",
            engine: "v8" as const,
            engineVersion: undefined,
            tier: "turbofan" as const,
            oracleId: "v8-native-intrinsics" as const,
            oracleVersion: "1" as const
        };
        await finalizeHotArtifactBundle(
            workspace,
            summary([
                run({
                    stdout: "Привет 🔥\n",
                    stderr: "ошибка? нет",
                    worker: {
                        suite: "artifact-test",
                        runtime,
                        scenarios: ["scenario"],
                        targets: [],
                        checks: [],
                        invocations: {},
                        coverage: [],
                        problems: [],
                        events: []
                    }
                })
            ]),
            suite
        );
        const loaded = await readHotArtifactBundle(output);
        expect(loaded.summary.runs[0].stdout).toBe("Привет 🔥\n");
        expect(loaded.summary.runs[0].stderr).toBe("ошибка? нет");
        expect(loaded.manifest.runtimeOracles[0]?.engineVersion).toBe(
            "unknown"
        );
    });

    test("round-trips every advisory diagnostic and JavaScriptCore target shape", async () => {
        const output = await temporaryOutput("artifact-diagnostics");
        const workspace = await beginHotArtifactBundle(output);
        const diagnosticRun = run({
            runtime: "bun",
            tier: "jsc",
            worker: {
                suite: "artifact-test",
                runtime: {
                    name: "bun",
                    version: "1.2.3",
                    engine: "jsc",
                    tier: "jsc",
                    oracleId: "bun-jsc-public-api",
                    oracleVersion: "1"
                },
                adapter: {
                    id: "adapter",
                    version: "1",
                    sourceSha256: "a".repeat(64),
                    packageTreeSha256: "b".repeat(64),
                    probeRuntime: "bun",
                    probeRuntimeVersion: "1.2.3"
                },
                scenarios: ["scenario"],
                targets: [
                    {
                        id: "target",
                        functionName: "target",
                        engine: "jsc",
                        compiledHistorically: true,
                        currentTier: "not-observable",
                        dfgCompiles: 2,
                        reoptimizationRetries: 1,
                        compileTime: 0.5
                    }
                ],
                checks: [],
                invocations: { target: 1 },
                coverage: [],
                problems: [],
                events: [],
                diagnostics: {
                    jscSampling: {
                        oracleVersion: "1",
                        sampleIntervalMicroseconds: 1000,
                        totalSamples: 4,
                        tiers: { DFG: { samples: 2, percent: 50 } },
                        functions: "functions",
                        bytecodes: "bytecodes",
                        stackTraces: ["target@fixture.js:1"],
                        stackTraceCount: 1,
                        stackTracesTruncated: false
                    }
                }
            },
            diagnostics: {
                v8IcMaps: {
                    oracleVersion: "1",
                    engineVersion: "14.6.0.0",
                    events: [],
                    graph: {
                        maps: [
                            {
                                id: "map-1",
                                elementsKind: "PACKED_SMI_ELEMENTS",
                                properties: ["x"]
                            }
                        ],
                        transitions: [
                            {
                                from: "map-1",
                                to: "map-2",
                                property: "x",
                                reason: "transition"
                            }
                        ],
                        inlineCaches: [
                            {
                                siteId: "site-1",
                                operation: "LoadIC",
                                from: "1",
                                to: "P",
                                mapId: "map-1",
                                key: "x",
                                line: 1,
                                column: 2,
                                correlation: "target",
                                targetId: "target",
                                functionName: "target"
                            }
                        ]
                    },
                    targetScope: {
                        requestedTargetIds: ["target"],
                        matchedTargetIds: ["target"],
                        unmatchedTargetIds: [],
                        ambiguousTargetIds: []
                    }
                },
                cpuProfile: {
                    oracleVersion: "1",
                    totalSamples: 2,
                    unattributedSamples: 1,
                    functions: [
                        {
                            functionName: "target",
                            url: "fixture.js",
                            line: 1,
                            column: 2,
                            candidateId: "candidate",
                            targetId: "target",
                            samples: 2,
                            sampleShare: 1,
                            correlation: "target"
                        }
                    ],
                    unobservedCandidateIds: []
                },
                jscSampling: {
                    oracleVersion: "1",
                    sampleIntervalMicroseconds: 1000,
                    totalSamples: 4,
                    tiers: { DFG: { samples: 2, percent: 50 } },
                    functions: "functions",
                    bytecodes: "bytecodes",
                    stackTraces: ["target@fixture.js:1"],
                    stackTraceCount: 1,
                    stackTracesTruncated: false
                },
                problems: [
                    {
                        problemId: "cpu-profile-diagnostic-gap",
                        message: "partial diagnostic",
                        targetId: "target",
                        detail: "one sample was not attributed",
                        confidence: "medium"
                    }
                ]
            }
        });
        await finalizeHotArtifactBundle(
            workspace,
            summary([diagnosticRun]),
            suite
        );

        const loaded = await readHotArtifactBundle(output);
        expect(loaded.summary.runs[0].diagnostics).toEqual(
            diagnosticRun.diagnostics
        );
        expect(loaded.summary.runs[0].worker?.targets[0]).toEqual(
            diagnosticRun.worker?.targets[0]
        );
    });

    test("rejects summary references outside the declared inventory", async () => {
        const output = await temporaryOutput("artifact-reference");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary([run()]), suite);
        const serialized = JSON.parse(
            await readFile(join(output, "summary.json"), "utf8")
        ) as HotRunSummary;
        const [first] = serialized.runs;
        await authenticateReplacement(output, "summary.json", {
            ...serialized,
            runs: [
                {
                    ...first,
                    artifacts: { ...first.artifacts, stdout: "../../outside" }
                }
            ]
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "Unsafe or undeclared artifact reference"
        );
        for (const diagnostics of [
            {
                v8IcMaps: {
                    oracleVersion: "1",
                    engineVersion: "14.6.0.0",
                    events: [],
                    graph: { maps: [], transitions: [], inlineCaches: [] },
                    targetScope: {
                        requestedTargetIds: [],
                        matchedTargetIds: [],
                        unmatchedTargetIds: [],
                        ambiguousTargetIds: []
                    },
                    artifact: "../../outside"
                }
            },
            {
                cpuProfile: {
                    oracleVersion: "1",
                    totalSamples: 0,
                    unattributedSamples: 0,
                    functions: [],
                    unobservedCandidateIds: [],
                    artifact: "diagnostics/not-declared.cpuprofile"
                }
            }
        ]) {
            // oxlint-disable-next-line no-await-in-loop -- Every diagnostic artifact reference is independently inventory-checked.
            await authenticateReplacement(output, "summary.json", {
                ...serialized,
                runs: [{ ...first, diagnostics }]
            });
            // oxlint-disable-next-line no-await-in-loop -- Raw diagnostic locators may never escape or bypass the trusted manifest inventory.
            await expect(readHotArtifactBundle(output)).rejects.toThrow(
                "Unsafe or undeclared artifact reference"
            );
        }
    });

    test("rejects unsupported or inconsistent schema versions", async () => {
        const output = await temporaryOutput("artifact-schema");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary(), suite);
        const manifest = await readManifest(output);
        await writeManifest(output, { ...manifest, schemaVersion: "2" as "1" });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "Unsupported check-hot artifact schema 2"
        );
        await writeManifest(output, manifest);
        const serialized = JSON.parse(
            await readFile(join(output, "summary.json"), "utf8")
        ) as HotRunSummary;
        await authenticateReplacement(output, "summary.json", {
            ...serialized,
            artifactSchemaVersion: "future"
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "schema versions differ"
        );
    });

    test("cross-checks manifest verdict and oracle identity against the summary", async () => {
        const output = await temporaryOutput("artifact-cross-identity");
        const workspace = await beginHotArtifactBundle(output);
        const runtime = {
            name: "node" as const,
            version: "26.7.0",
            engine: "v8" as const,
            engineVersion: "14.2",
            tier: "turbofan" as const,
            oracleId: "v8-native-intrinsics" as const,
            oracleVersion: "1"
        };
        await finalizeHotArtifactBundle(
            workspace,
            summary([
                run({
                    worker: {
                        suite: "artifact-test",
                        runtime,
                        scenarios: ["scenario"],
                        targets: [],
                        checks: [],
                        invocations: {},
                        coverage: [],
                        problems: [],
                        events: []
                    }
                })
            ]),
            suite
        );
        const manifest = await readManifest(output);
        for (const altered of [
            { ...manifest, suite: "different" },
            { ...manifest, passed: false }
        ]) {
            // oxlint-disable-next-line no-await-in-loop -- Each manifest verdict identity must independently agree with the summary.
            await writeManifest(output, altered);
            // oxlint-disable-next-line no-await-in-loop -- Manifest verdict fields must still agree with the hash-validated summary.
            await expect(readHotArtifactBundle(output)).rejects.toThrow(
                "verdict identity differ"
            );
        }
        await writeManifest(output, {
            ...manifest,
            runtimeOracles: [
                { ...manifest.runtimeOracles[0], oracleVersion: "different" }
            ]
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "runtime oracle identities differ"
        );
        await writeManifest(output, {
            ...manifest,
            runtimeOracles: [
                manifest.runtimeOracles[0],
                manifest.runtimeOracles[0]
            ]
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "runtime oracle identities differ"
        );
    });

    test("rejects malformed manifest, summary, command, and event schemas", async () => {
        const output = await temporaryOutput("artifact-schema-shapes");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary([run()]), suite);
        const originalManifest = await readManifest(output);
        for (const malformed of [
            {},
            { ...originalManifest, configuredEnvironmentValuesIncluded: true },
            { ...originalManifest, runtimeOracles: [{}] },
            {
                ...originalManifest,
                sourceIdentity: { graphComplete: true, diagnostics: [1] }
            },
            {
                ...originalManifest,
                files: [{ path: "summary.json", bytes: -1, sha256: "bad" }]
            },
            {
                ...originalManifest,
                files: [
                    {
                        path: "summary.json",
                        bytes: 0,
                        sha256: "\\".repeat(64)
                    }
                ]
            }
        ]) {
            // oxlint-disable-next-line no-await-in-loop -- Each malformed top-level shape exercises a different offline input boundary.
            await writeFile(
                join(output, "manifest.json"),
                `${JSON.stringify(malformed)}\n`
            );
            // oxlint-disable-next-line no-await-in-loop -- The parser must reject every invalid schema before hydration.
            await expect(readHotArtifactBundle(output)).rejects.toThrow(
                "Artifact manifest has an invalid schema"
            );
        }
        await writeManifest(output, originalManifest);
        const serialized = JSON.parse(
            await readFile(join(output, "summary.json"), "utf8")
        ) as HotRunSummary;
        await authenticateReplacement(output, "summary.json", {
            ...serialized,
            runs: [null]
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "summary has an invalid schema"
        );
        await authenticateReplacement(output, "summary.json", serialized);
        const artifacts = serialized.runs[0].artifacts as NonNullable<
            HotRunResult["artifacts"]
        >;
        await authenticateReplacement(output, artifacts.command, ["node", 1]);
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "command has an invalid schema"
        );
        await authenticateReplacement(output, artifacts.command, ["node"]);
        await authenticateReplacement(output, artifacts.events, [{}]);
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "event stream has an invalid schema"
        );
    });

    test("rejects malformed nested problems, coverage, and diagnostics before offline reporting", async () => {
        const output = await temporaryOutput("artifact-nested-schema");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary([run()]), suite);
        const serialized = JSON.parse(
            await readFile(join(output, "summary.json"), "utf8")
        ) as HotRunSummary;
        const baseline = serialized.runs[0];
        for (const malformedRun of [
            { ...baseline, problems: [{}] },
            {
                ...baseline,
                problems: [
                    {
                        problemId: "invented-offline-problem",
                        message: "not cataloged"
                    }
                ]
            },
            {
                ...baseline,
                coverage: [
                    {
                        obligationId: "obligation",
                        status: "invented",
                        reason: "bad",
                        scenarios: []
                    }
                ]
            },
            {
                ...baseline,
                coverage: [
                    {
                        obligationId: "obligation",
                        status: "blocked",
                        reason: "bad preflight",
                        scenarios: [],
                        preflight: {}
                    }
                ]
            },
            {
                ...baseline,
                worker: {
                    suite: "artifact-test",
                    runtime: {
                        name: "node",
                        version: "26.7.0",
                        engine: "v8",
                        engineVersion: "14.6.202.34-node.28",
                        tier: "turbofan",
                        oracleId: "v8-native-intrinsics",
                        oracleVersion: "1"
                    },
                    scenarios: [],
                    targets: [],
                    checks: [],
                    invocations: {},
                    coverage: [],
                    preflight: [{}],
                    problems: [],
                    events: []
                }
            },
            { ...baseline, diagnostics: { v8IcMaps: {} } },
            { ...baseline, diagnostics: { cpuProfile: {} } },
            { ...baseline, diagnostics: { jscSampling: {} } },
            { ...baseline, diagnostics: { problems: [{}] } }
        ]) {
            // oxlint-disable-next-line no-await-in-loop -- Each nested report consumer has its own validated schema boundary.
            await authenticateReplacement(output, "summary.json", {
                ...serialized,
                runs: [malformedRun]
            });
            // oxlint-disable-next-line no-await-in-loop -- Invalid nested data must be rejected before the report dereferences it.
            await expect(readHotArtifactBundle(output)).rejects.toThrow(
                "summary has an invalid schema"
            );
        }
    });

    test("rejects a run whose inventory file-reference table is missing", async () => {
        const output = await temporaryOutput("artifact-run-reference");
        const workspace = await beginHotArtifactBundle(output);
        await finalizeHotArtifactBundle(workspace, summary([run()]), suite);
        const serialized = JSON.parse(
            await readFile(join(output, "summary.json"), "utf8")
        ) as HotRunSummary;
        const [{ artifacts: _artifacts, ...withoutArtifacts }] =
            serialized.runs;
        await authenticateReplacement(output, "summary.json", {
            ...serialized,
            runs: [withoutArtifacts]
        });
        await expect(readHotArtifactBundle(output)).rejects.toThrow(
            "has no file references"
        );
    });
});
