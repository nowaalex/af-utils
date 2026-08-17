import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, test, vi } from "vitest";

const executeProcessMock = vi.hoisted(() => vi.fn());

vi.mock("../process-execution.js", () => ({
    executeProcess: executeProcessMock
}));

import { probeHotModule } from "./probe.js";

const directories: string[] = [];

afterEach(async () => {
    executeProcessMock.mockReset();
    await Promise.all(
        directories
            .splice(0)
            .map(directory => rm(directory, { recursive: true, force: true }))
    );
});

describe("probe process failures", () => {
    test("reports both a discovery timeout and failed process-tree cleanup", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-probe-"));
        directories.push(directory);
        const target = join(directory, "target.mjs");
        const runner = join(directory, "runner.mjs");
        await writeFile(target, "export const target = () => 1;\n");
        await writeFile(runner, "export default {};\n");
        executeProcessMock.mockResolvedValueOnce({
            stdout: "",
            stderr: "",
            error: Object.assign(new Error("worker timed out"), {
                code: "ETIMEDOUT"
            }),
            cleanupError: Object.assign(new Error("descendant survived"), {
                code: "ECLEANUP"
            }),
            status: null,
            signal: "SIGKILL"
        });

        await expect(
            probeHotModule({
                specifier: pathToFileURL(target).href,
                parentUrl: import.meta.url,
                testRunnerSpecifier: pathToFileURL(runner).href,
                package: { name: "fixture", version: "1.0.0" },
                timeoutMs: 25
            })
        ).rejects.toThrow(
            "Module recipe discovery failed: exceeded the 25ms timeout; process-tree cleanup failed: descendant survived"
        );
    });

    test("reports both a discovery exit failure and failed cleanup", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-probe-"));
        directories.push(directory);
        const target = join(directory, "target.mjs");
        const runner = join(directory, "runner.mjs");
        await writeFile(target, "export const target = () => 1;\n");
        await writeFile(runner, "export default {};\n");
        executeProcessMock.mockResolvedValueOnce({
            stdout: "",
            stderr: "worker crashed",
            cleanupError: Object.assign(new Error("descendant survived"), {
                code: "ECLEANUP"
            }),
            status: 7,
            signal: null
        });

        await expect(
            probeHotModule({
                specifier: pathToFileURL(target).href,
                parentUrl: import.meta.url,
                testRunnerSpecifier: pathToFileURL(runner).href,
                package: { name: "fixture", version: "1.0.0" },
                timeoutMs: 25
            })
        ).rejects.toThrow(
            "Module recipe discovery failed: process exited with 7: worker crashed; process-tree cleanup failed: descendant survived"
        );
    });

    test("retains timeout and cleanup failures on an isolated attempt", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-probe-"));
        directories.push(directory);
        const target = join(directory, "target.mjs");
        const runner = join(directory, "runner.mjs");
        await writeFile(target, "export const target = () => 1;\n");
        await writeFile(runner, "export default {};\n");
        const sourceSha256 = "a".repeat(64);
        const discovery = {
            kind: "discovery",
            runnerId: "fixture-runner",
            runnerVersion: "1.0.0",
            package: { name: "fixture", version: "1.0.0" },
            runtime: { name: "node", version: "24.19.0", engine: "v8" },
            perSampleTimeoutMs: 1,
            runnerPackageTree: {
                sourceSha256,
                fileCount: 1,
                ignoredRelativeFiles: []
            },
            runnerEntryPackagePath: "runner.mjs",
            runnerSourceGraph: [{ relativeFile: "runner.mjs", sourceSha256 }],
            coordinates: [
                {
                    functionName: "target",
                    label: "sample",
                    targetSourceSha256: "b".repeat(64),
                    coverage: []
                }
            ]
        };
        executeProcessMock
            .mockResolvedValueOnce({
                stdout: `__CHECK_HOT_PROBE_RESULT__=${JSON.stringify(discovery)}\n`,
                stderr: "",
                status: 0,
                signal: null
            })
            .mockResolvedValueOnce({
                stdout: "",
                stderr: "",
                error: Object.assign(new Error("worker timed out"), {
                    code: "ETIMEDOUT"
                }),
                cleanupError: Object.assign(
                    new Error("attempt descendant survived"),
                    { code: "ECLEANUP" }
                ),
                status: null,
                signal: "SIGKILL"
            })
            .mockResolvedValueOnce({
                stdout: `__CHECK_HOT_PROBE_RESULT__=${JSON.stringify({
                    kind: "attempt",
                    functionName: "target",
                    label: "sample",
                    status: "accepted",
                    fingerprint: "stable"
                })}\n`,
                stderr: "",
                status: 0,
                signal: null
            });

        const manifest = await probeHotModule({
            specifier: pathToFileURL(target).href,
            parentUrl: import.meta.url,
            testRunnerSpecifier: pathToFileURL(runner).href,
            package: { name: "fixture", version: "1.0.0" },
            timeoutMs: 25
        });

        expect(manifest.attempts).toEqual([
            expect.objectContaining({
                status: "threw",
                error: "isolated recipe attempt exceeded the 25ms hard timeout; process-tree cleanup failed: attempt descendant survived"
            })
        ]);
    });
});
