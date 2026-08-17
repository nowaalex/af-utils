import { open, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, test, vi } from "vitest";

const ioControl = vi.hoisted(() => ({
    forbiddenReadPath: "",
    forbiddenStreamPath: "",
    mutateDuringStreamPath: ""
}));

vi.mock("node:fs", async importOriginal => {
    const actual = await importOriginal<typeof import("node:fs")>();
    return {
        ...actual,
        createReadStream: (
            ...arguments_: Parameters<typeof actual.createReadStream>
        ): ReturnType<typeof actual.createReadStream> => {
            const path = String(arguments_[0]);
            if (path === ioControl.forbiddenStreamPath) {
                throw new Error("raw diagnostic stream must not start");
            }
            const stream = actual.createReadStream(...arguments_);
            if (path === ioControl.mutateDuringStreamPath) {
                stream.once("data", () => {
                    actual.utimesSync(path, new Date(0), new Date(0));
                });
            }
            return stream;
        }
    };
});

vi.mock("node:fs/promises", async importOriginal => {
    const actual = await importOriginal<typeof import("node:fs/promises")>();
    return {
        ...actual,
        readFile: (
            ...arguments_: Parameters<typeof actual.readFile>
        ): ReturnType<typeof actual.readFile> => {
            if (String(arguments_[0]) === ioControl.forbiddenReadPath) {
                throw new Error(
                    "raw diagnostic was materialized with readFile"
                );
            }
            return actual.readFile(...arguments_);
        }
    };
});

import {
    beginHotArtifactBundle,
    finalizeHotArtifactBundle,
    readHotArtifactBundle
} from "./index.js";
import type { HotRunResult, HotRunSummary, HotSuite } from "../types.js";

const outputs: string[] = [];

afterEach(async () => {
    ioControl.forbiddenReadPath = "";
    ioControl.forbiddenStreamPath = "";
    ioControl.mutateDuringStreamPath = "";
    await Promise.all(
        outputs
            .splice(0)
            .map(path => rm(path, { recursive: true, force: true }))
    );
});

test("streams an over-cap retained diagnostic for inventory and offline integrity", async () => {
    const parent = await import("node:fs/promises").then(({ mkdtemp }) =>
        mkdtemp(join(tmpdir(), "check-hot-streaming-artifact-"))
    );
    outputs.push(parent);
    const output = join(parent, "bundle");
    const workspace = await beginHotArtifactBundle(output);
    const artifact = "diagnostics/over-cap.v8.log";
    const rawPath = join(workspace.staging, artifact);
    await import("node:fs/promises").then(({ mkdir }) =>
        mkdir(join(workspace.staging, "diagnostics"), { recursive: true })
    );
    const raw = await open(rawPath, "w");
    await raw.truncate(65 * 1024 * 1024);
    await raw.close();

    const run: HotRunResult = {
        runtime: "node",
        tier: "turbofan",
        mode: "combined",
        scenarios: ["scenario"],
        repetition: 1,
        durationMs: 1,
        passed: true,
        coverage: [],
        deoptimizations: [],
        problems: [],
        stdout: "",
        stderr: "",
        command: ["node", "worker.js"],
        events: [],
        diagnostics: {
            v8IcMaps: {
                oracleVersion: "1",
                engineVersion: "14.6.202.34-node.28",
                events: [],
                graph: { maps: [], transitions: [], inlineCaches: [] },
                targetScope: {
                    requestedTargetIds: [],
                    matchedTargetIds: [],
                    unmatchedTargetIds: [],
                    ambiguousTargetIds: []
                },
                artifact,
                gap: "raw log exceeded diagnosticMaxBytes=67108864"
            }
        }
    };
    const summary: HotRunSummary = {
        suite: "streaming-artifact",
        runs: [run],
        problems: [],
        coverageComplete: true,
        passed: true
    };
    const suite = {
        name: "streaming-artifact",
        setup: () => ({}),
        scenarios: []
    } satisfies HotSuite<object>;

    ioControl.forbiddenReadPath = rawPath;
    await finalizeHotArtifactBundle(workspace, summary, suite);
    const publishedRawPath = join(output, artifact);
    ioControl.forbiddenReadPath = publishedRawPath;
    const loaded = await readHotArtifactBundle(output);
    expect(loaded.summary.runs[0].diagnostics?.v8IcMaps?.artifact).toBe(
        artifact
    );
    expect(
        loaded.manifest.files.find(file => file.path === artifact)
    ).toMatchObject({ bytes: 65 * 1024 * 1024 });

    const manifestPath = join(output, "manifest.json");
    const manifest = JSON.parse(
        await readFile(manifestPath, "utf8")
    ) as typeof loaded.manifest;
    await import("node:fs/promises").then(({ writeFile }) =>
        writeFile(
            manifestPath,
            `${JSON.stringify({
                ...manifest,
                files: manifest.files.map(file =>
                    file.path === artifact
                        ? { ...file, bytes: file.bytes + 1 }
                        : file
                )
            })}\n`
        )
    );
    ioControl.forbiddenStreamPath = publishedRawPath;
    await expect(readHotArtifactBundle(output)).rejects.toThrow(
        `Artifact integrity mismatch: ${artifact}`
    );
    ioControl.forbiddenStreamPath = "";
    await import("node:fs/promises").then(({ writeFile }) =>
        writeFile(manifestPath, `${JSON.stringify(manifest)}\n`)
    );

    ioControl.mutateDuringStreamPath = publishedRawPath;
    await expect(readHotArtifactBundle(output)).rejects.toThrow(
        `Artifact changed while hashing: ${artifact}`
    );
    ioControl.mutateDuringStreamPath = "";
    await expect(readHotArtifactBundle(output)).resolves.toMatchObject({
        root: output
    });

    const tampered = await open(publishedRawPath, "r+");
    await tampered.write(Buffer.from([1]), 0, 1, 0);
    await tampered.close();
    await expect(readHotArtifactBundle(output)).rejects.toThrow(
        `Artifact integrity mismatch: ${artifact}`
    );

    // The guard is intentionally a mocked readFile, while SHA-256 uses a stream.
    expect(() => readFile(publishedRawPath)).toThrow(
        "raw diagnostic was materialized with readFile"
    );
});
