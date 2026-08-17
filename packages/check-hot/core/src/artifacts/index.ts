import { createHash } from "node:crypto";
import { createReadStream, existsSync, realpathSync } from "node:fs";
import type { Stats } from "node:fs";
import { createRequire } from "node:module";
import {
    cp,
    lstat,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    rename,
    rm,
    writeFile
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";

import type { HotRunResult, HotRunSummary, HotSuite } from "../types.js";
import {
    coverageSchema,
    diagnosticsSchema,
    eventSchema,
    finiteNumberSchema,
    hotWorkerResultSchema,
    nonnegativeIntegerSchema,
    problemSchema,
    sha256Schema
} from "../structured-result-schemas.js";

/** Current on-disk artifact contract. */
export const HOT_ARTIFACT_SCHEMA_VERSION = "1" as const;
const packageVersion = (
    createRequire(import.meta.url)("../../package.json") as {
        version: string;
    }
).version;

const artifactReferencesSchema = z.object({
    stdout: z.string(),
    stderr: z.string(),
    command: z.string(),
    events: z.string()
});
const runSchema = z.object({
    runtime: z.enum(["node", "deno", "bun"]),
    tier: z.enum(["maglev", "turbofan", "jsc"]),
    mode: z.enum(["combined", "isolated"]),
    scenarios: z.array(z.string()),
    repetition: nonnegativeIntegerSchema,
    durationMs: finiteNumberSchema,
    passed: z.boolean(),
    worker: hotWorkerResultSchema.optional(),
    coverage: z.array(coverageSchema),
    deoptimizations: z.array(z.string()),
    problems: z.array(problemSchema),
    stdout: z.string(),
    stderr: z.string(),
    command: z.array(z.string()),
    events: z.array(eventSchema),
    diagnostics: diagnosticsSchema.optional(),
    artifacts: artifactReferencesSchema.optional()
});
const manifestSchema = z.object({
    schemaVersion: z.string(),
    checkHotVersion: z.string(),
    createdAt: z.string(),
    suite: z.string(),
    passed: z.boolean(),
    configuredEnvironmentValuesIncluded: z.literal(false),
    runtimeOracles: z.array(
        z.object({
            runtime: z.string(),
            runtimeVersion: z.string(),
            engine: z.string(),
            engineVersion: z.string(),
            oracleId: z.string(),
            oracleVersion: z.string()
        })
    ),
    sourceIdentity: z
        .object({
            runtime: z.enum(["node", "deno", "bun"]).optional(),
            entrySourceSha256: sha256Schema.optional(),
            entryPackagePath: z.string().optional(),
            publicEntries: z
                .array(
                    z.object({
                        modulePath: z.string(),
                        entryPackagePath: z.string(),
                        entrySourceSha256: sha256Schema
                    })
                )
                .optional(),
            sourceGraph: z
                .array(
                    z.object({
                        relativeFile: z.string(),
                        sourceSha256: sha256Schema
                    })
                )
                .optional(),
            packageTree: z
                .object({
                    sourceSha256: sha256Schema,
                    fileCount: nonnegativeIntegerSchema,
                    ignoredRelativeFiles: z.array(z.string())
                })
                .optional(),
            graphComplete: z.boolean(),
            diagnostics: z.array(z.string()),
            externalBoundaries: z
                .array(
                    z.object({
                        importer: z.string(),
                        request: z.string(),
                        mode: z.enum(["import", "require"]),
                        packageName: z.string().optional(),
                        packageVersion: z.string().optional(),
                        packageRelativeFile: z.string()
                    })
                )
                .optional(),
            sourceLoader: z.literal("tsx").optional()
        })
        .optional(),
    files: z.array(
        z.object({
            path: z.string(),
            bytes: nonnegativeIntegerSchema,
            sha256: sha256Schema
        })
    )
});
const summarySchema = z.object({
    suite: z.string(),
    passed: z.boolean(),
    coverageComplete: z.boolean(),
    problems: z.array(problemSchema),
    runs: z.array(runSchema),
    artifactSchemaVersion: z.string().optional()
});

const parseArtifactJson = <Result>(
    raw: string,
    schema: z.ZodType,
    label: string
): Result => {
    const value = JSON.parse(raw) as unknown;
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
        throw new Error("Artifact " + label + " has an invalid schema");
    }
    return parsed.data as Result;
};

const parseManifest = (raw: string): HotArtifactManifest =>
    parseArtifactJson(raw, manifestSchema, "manifest");

const parseSummary = (raw: string): HotRunSummary =>
    parseArtifactJson(raw, summarySchema, "summary");

const parseCommand = (raw: string): readonly string[] =>
    parseArtifactJson(raw, z.array(z.string()), "command");

const parseEvents = (raw: string): HotRunResult["events"] =>
    parseArtifactJson(raw, z.array(eventSchema), "event stream");

/** Integrity record for one bundle file. */
export interface HotArtifactFile {
    path: string;
    bytes: number;
    sha256: string;
}

/** Manifest used to validate and inspect an offline bundle. */
export interface HotArtifactManifest {
    schemaVersion: typeof HOT_ARTIFACT_SCHEMA_VERSION;
    checkHotVersion: string;
    createdAt: string;
    suite: string;
    passed: boolean;
    /** Configured environment maps are excluded; raw output can still contain secrets. */
    configuredEnvironmentValuesIncluded: false;
    runtimeOracles: readonly {
        runtime: string;
        runtimeVersion: string;
        engine: string;
        engineVersion: string;
        oracleId: string;
        oracleVersion: string;
    }[];
    sourceIdentity?: HotSuite<unknown>["analysis"];
    files: readonly HotArtifactFile[];
}

const artifactOracleIdentity = (
    value: HotArtifactManifest["runtimeOracles"][number]
) => JSON.stringify(value);

/** Staging directory that becomes visible only after bundle finalization. */
export interface HotArtifactWorkspace {
    output: string;
    staging: string;
}

const containsPath = (parent: string, child: string) => {
    const fragment = relative(parent, child);
    return !fragment.startsWith("../") && fragment !== "..";
};

const canonicalFuturePath = (value: string) => {
    let existing = resolve(value);
    const suffix: string[] = [];
    while (!existsSync(existing)) {
        const parent = dirname(existing);
        suffix.unshift(basename(existing));
        existing = parent;
    }
    return resolve(realpathSync(existing), ...suffix);
};

/** Convert platform separators to the portable bundle-manifest spelling. */
export const normalizeHotArtifactPath = (value: string) =>
    value.replaceAll("\\", "/");

/** Validate one untrusted bundle-relative manifest path. */
export const isHotArtifactRelativePath = (value: string) =>
    !value.includes("\\") &&
    !value.includes(":") &&
    value
        .split("/")
        .every(part => part.length > 0 && part !== "." && part !== "..");

/** Reject output layouts that would mutate a finalized inventory afterwards. */
export const assertHotArtifactOutputPaths = (
    artifactOutput: string,
    jsonOutput?: string
) => {
    if (!jsonOutput) return;
    const artifact = canonicalFuturePath(artifactOutput);
    const json = canonicalFuturePath(jsonOutput);
    if (containsPath(artifact, json) || containsPath(json, artifact)) {
        throw new Error(
            "jsonOutput and artifactOutput must be disjoint paths so the finalized bundle inventory remains immutable"
        );
    }
};

/** Create a new sibling staging directory without overwriting old evidence. */
export const beginHotArtifactBundle = async (
    outputValue: string
): Promise<HotArtifactWorkspace> => {
    const output = resolve(outputValue);
    if (existsSync(output)) {
        throw new Error(
            `Artifact destination already exists: ${output}; choose a new directory so evidence is not mixed or overwritten`
        );
    }
    await mkdir(dirname(output), { recursive: true });
    const staging = await mkdtemp(join(tmpdir(), "check-hot-artifacts-"));
    return { output, staging };
};

/** Stable filesystem-safe directory label for one matrix cell. */
export const hotArtifactRunPath = (
    run: Pick<
        HotRunResult,
        "runtime" | "tier" | "mode" | "scenarios" | "repetition"
    >
) => {
    const identity = JSON.stringify([
        run.runtime,
        run.tier,
        run.mode,
        run.scenarios,
        run.repetition
    ]);
    const digest = createHash("sha256").update(identity).digest("hex");
    return [
        run.runtime,
        run.tier,
        run.mode,
        `cell-${digest.slice(0, 20)}-run-${run.repetition}`
    ].join("/");
};

const writeJson = (path: string, value: unknown) =>
    writeFile(path, `${JSON.stringify(value, null, 2)}\n`);

const listFiles = async (root: string, current = root): Promise<string[]> => {
    const result: string[] = [];
    for (const entry of await readdir(current, { withFileTypes: true })) {
        const path = join(current, entry.name);
        if (entry.isDirectory()) {
            // oxlint-disable-next-line no-await-in-loop -- Files are hashed after all concurrent workers have closed their artifacts.
            result.push(...(await listFiles(root, path)));
        } else if (entry.isFile()) {
            result.push(normalizeHotArtifactPath(relative(root, path)));
        } else {
            throw new Error(
                `Artifact bundle contains unsupported filesystem entry: ${relative(root, path)}`
            );
        }
    }
    return result.toSorted();
};

interface HotArtifactFileDigest {
    bytes: number;
    sha256: string;
}

type HotArtifactFileIdentity = Pick<
    Stats,
    "dev" | "ino" | "size" | "mtimeMs" | "isFile" | "isSymbolicLink"
>;

/** Compare the pre/post stream identity without trusting a pathname race. */
export const isUnchangedHotArtifactFile = (
    before: HotArtifactFileIdentity,
    after: HotArtifactFileIdentity
) =>
    after.isFile() &&
    !after.isSymbolicLink() &&
    after.dev === before.dev &&
    after.ino === before.ino &&
    after.size === before.size &&
    after.mtimeMs === before.mtimeMs;

const digestRegularArtifactFile = async (
    path: string,
    label: string,
    expectedBytes?: number
): Promise<HotArtifactFileDigest> => {
    const before = await lstat(path);
    if (!before.isFile() || before.isSymbolicLink()) {
        throw new Error(`Artifact is not a regular file: ${label}`);
    }
    if (expectedBytes !== undefined && before.size !== expectedBytes) {
        throw new Error(`Artifact integrity mismatch: ${label}`);
    }

    const hash = createHash("sha256");
    for await (const chunk of createReadStream(path)) {
        hash.update(chunk);
    }

    const after = await lstat(path);
    if (!isUnchangedHotArtifactFile(before, after)) {
        throw new Error(`Artifact changed while hashing: ${label}`);
    }
    return { bytes: before.size, sha256: hash.digest("hex") };
};

/** Finish a bundle, inventory files, and atomically publish the directory. */
export const finalizeHotArtifactBundle = async (
    workspace: HotArtifactWorkspace,
    summary: HotRunSummary,
    suite: HotSuite<unknown>,
    checkHotVersion = packageVersion
) => {
    let publicationContainer: string | undefined;
    try {
        const artifactRuns = summary.runs.map(run => {
            const base = hotArtifactRunPath(run);
            return {
                ...run,
                stdout: "",
                stderr: "",
                command: [],
                events: [],
                artifacts: {
                    stdout: `${base}/stdout.log`,
                    stderr: `${base}/stderr.log`,
                    command: `${base}/command.json`,
                    events: `${base}/events.json`
                }
            };
        });
        const serializableSummary = {
            ...summary,
            runs: artifactRuns,
            artifactSchemaVersion: HOT_ARTIFACT_SCHEMA_VERSION
        } satisfies HotRunSummary;
        await writeJson(
            join(workspace.staging, "summary.json"),
            serializableSummary
        );
        await Promise.all(
            summary.runs.map(async run => {
                const directory = join(
                    workspace.staging,
                    hotArtifactRunPath(run)
                );
                await mkdir(directory, { recursive: true });
                await Promise.all([
                    writeFile(join(directory, "stdout.log"), run.stdout),
                    writeFile(join(directory, "stderr.log"), run.stderr),
                    writeJson(join(directory, "command.json"), run.command),
                    writeJson(join(directory, "events.json"), run.events)
                ]);
            })
        );
        const files: HotArtifactFile[] = [];
        for (const path of await listFiles(workspace.staging)) {
            // oxlint-disable-next-line no-await-in-loop -- Final inventory must hash immutable complete files in deterministic order.
            const digest = await digestRegularArtifactFile(
                join(workspace.staging, path),
                path
            );
            files.push({ path, ...digest });
        }
        const runtimeOracles = summary.runs.flatMap(run => {
            const runtime = run.worker?.runtime;
            return runtime
                ? [
                      {
                          runtime: runtime.name,
                          runtimeVersion: runtime.version,
                          engine: runtime.engine,
                          engineVersion: runtime.engineVersion ?? "unknown",
                          oracleId: runtime.oracleId,
                          oracleVersion: runtime.oracleVersion
                      }
                  ]
                : [];
        });
        const uniqueOracles = [
            ...new Map(
                runtimeOracles.map(oracle => [JSON.stringify(oracle), oracle])
            ).values()
        ];
        const manifest: HotArtifactManifest = {
            schemaVersion: HOT_ARTIFACT_SCHEMA_VERSION,
            checkHotVersion,
            createdAt: new Date().toISOString(),
            suite: summary.suite,
            passed: summary.passed,
            configuredEnvironmentValuesIncluded: false,
            runtimeOracles: uniqueOracles,
            sourceIdentity: suite.analysis,
            files
        };
        await writeJson(join(workspace.staging, "manifest.json"), manifest);
        publicationContainer = await mkdtemp(
            join(
                dirname(workspace.output),
                `.${basename(workspace.output)}.partial-`
            )
        );
        const publication = join(publicationContainer, "bundle");
        await cp(workspace.staging, publication, {
            recursive: true
        });
        await rename(publication, workspace.output);
        return { ...serializableSummary, artifactSchemaVersion: "1" as const };
    } finally {
        await rm(workspace.staging, { recursive: true });
        if (publicationContainer) {
            await rm(publicationContainer, { recursive: true });
        }
    }
};

/** Read a completed bundle without importing or executing its suite. */
export const readHotArtifactBundle = async (inputValue: string) => {
    const input = resolve(inputValue);
    const inputInfo = await lstat(input);
    const root = inputInfo.isDirectory()
        ? input
        : inputInfo.isFile() &&
            !inputInfo.isSymbolicLink() &&
            basename(input) === "manifest.json"
          ? dirname(input)
          : (() => {
                throw new Error(
                    "Artifact input must be a bundle directory or its regular manifest.json"
                );
            })();
    const manifestInfo = await lstat(join(root, "manifest.json"));
    if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink()) {
        throw new Error("Artifact manifest is not a regular file");
    }
    const manifest = parseManifest(
        await readFile(join(root, "manifest.json"), "utf8")
    );
    if (manifest.schemaVersion !== HOT_ARTIFACT_SCHEMA_VERSION) {
        throw new Error(
            `Unsupported check-hot artifact schema ${String(manifest.schemaVersion)}`
        );
    }
    const declared = new Set<string>();
    for (const file of manifest.files) {
        if (!isHotArtifactRelativePath(file.path) || declared.has(file.path)) {
            throw new Error(`Unsafe or duplicate artifact path ${file.path}`);
        }
        declared.add(file.path);
        const path = resolve(root, file.path);
        // oxlint-disable-next-line no-await-in-loop -- Every declared file is stat-checked, then streamed through SHA-256 before offline reporting.
        const digest = await digestRegularArtifactFile(
            path,
            file.path,
            file.bytes
        );
        if (digest.sha256 !== file.sha256) {
            throw new Error(`Artifact integrity mismatch: ${file.path}`);
        }
    }
    const undeclared = (await listFiles(root)).filter(
        path => path !== "manifest.json" && !declared.has(path)
    );
    if (undeclared.length > 0) {
        throw new Error(
            `Artifact bundle contains undeclared files: ${undeclared.join(", ")}`
        );
    }
    const resolveReference = (reference: string) => {
        if (!declared.has(reference)) {
            throw new Error(
                `Unsafe or undeclared artifact reference ${reference}`
            );
        }
        return resolve(root, reference);
    };
    const serializedSummary = parseSummary(
        await readFile(join(root, "summary.json"), "utf8")
    );
    if (serializedSummary.artifactSchemaVersion !== manifest.schemaVersion) {
        throw new Error("Artifact manifest and summary schema versions differ");
    }
    if (
        serializedSummary.suite !== manifest.suite ||
        serializedSummary.passed !== manifest.passed
    ) {
        throw new Error(
            "Artifact manifest and summary verdict identity differ"
        );
    }
    const retainedRuntimeOracles = serializedSummary.runs.flatMap(run => {
        const runtime = run.worker?.runtime;
        return runtime
            ? [
                  {
                      runtime: runtime.name,
                      runtimeVersion: runtime.version,
                      engine: runtime.engine,
                      engineVersion: runtime.engineVersion ?? "unknown",
                      oracleId: runtime.oracleId,
                      oracleVersion: runtime.oracleVersion
                  }
              ]
            : [];
    });
    const manifestOracleIds = [
        ...new Set(
            manifest.runtimeOracles.map(oracle =>
                artifactOracleIdentity(oracle)
            )
        )
    ].toSorted();
    const retainedOracleIds = [
        ...new Set(
            retainedRuntimeOracles.map(oracle => artifactOracleIdentity(oracle))
        )
    ].toSorted();
    if (
        manifestOracleIds.length !== manifest.runtimeOracles.length ||
        JSON.stringify(manifestOracleIds) !== JSON.stringify(retainedOracleIds)
    ) {
        throw new Error(
            "Artifact manifest and summary runtime oracle identities differ"
        );
    }
    const runs: HotRunResult[] = [];
    for (const run of serializedSummary.runs) {
        for (const diagnosticArtifact of [
            run.diagnostics?.v8IcMaps?.artifact,
            run.diagnostics?.cpuProfile?.artifact
        ]) {
            if (diagnosticArtifact !== undefined) {
                resolveReference(diagnosticArtifact);
            }
        }
        if (!run.artifacts) {
            throw new Error("Artifact summary run has no file references");
        }
        // oxlint-disable-next-line no-await-in-loop -- Offline hydration follows already inventory-validated manifest paths.
        const [stdout, stderr, commandRaw, eventsRaw] = await Promise.all([
            readFile(resolveReference(run.artifacts.stdout), "utf8"),
            readFile(resolveReference(run.artifacts.stderr), "utf8"),
            readFile(resolveReference(run.artifacts.command), "utf8"),
            readFile(resolveReference(run.artifacts.events), "utf8")
        ]);
        runs.push({
            ...run,
            stdout,
            stderr,
            command: parseCommand(commandRaw),
            events: parseEvents(eventsRaw)
        });
    }
    const summary: HotRunSummary = { ...serializedSummary, runs };
    return { root, manifest, summary };
};
