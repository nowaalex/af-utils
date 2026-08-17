import { performance } from "node:perf_hooks";

import { describe, expect, test } from "vitest";

import { executeProcess } from "./process-execution.js";

const executeNode = (
    source: string,
    options: { maxBufferBytes?: number; timeoutMs?: number } = {}
) =>
    executeProcess([process.execPath, "-e", source], {
        cwd: process.cwd(),
        environment: process.env,
        maxBufferBytes: options.maxBufferBytes ?? 1024,
        timeoutMs: options.timeoutMs ?? 500
    });

const processExists = (pid: number) => {
    if (!Number.isSafeInteger(pid) || pid <= 0) return false;

    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
        throw error;
    }
};

const killProcess = (pid: number) => {
    if (!Number.isSafeInteger(pid) || pid <= 0) return;

    try {
        process.kill(pid, "SIGKILL");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
};

describe.runIf(process.env.CODEX_PERMISSION_PROFILE === undefined)(
    "asynchronous process execution",
    () => {
        test("captures successful output and exit status", async () => {
            const execution = await executeNode(
                'process.stdout.write("result"); process.stderr.write("trace")',
                { timeoutMs: 5_000 }
            );

            expect(execution).toMatchObject({
                stdout: "result",
                stderr: "trace",
                status: 0,
                signal: null,
                error: undefined,
                cleanupError: undefined
            });
        });

        test("hard-kills timeouts with the established error code", async () => {
            const execution = await executeNode("while (true) {};");

            expect(execution.error).toMatchObject({ code: "ETIMEDOUT" });
            expect(execution.cleanupError).toBeUndefined();
            expect(execution.status === 0 && execution.signal === null).toBe(
                false
            );
        });

        test("hard-kills output that exceeds the shared buffer", async () => {
            const execution = await executeNode(
                'process.stdout.write("x".repeat(2048))',
                { maxBufferBytes: 128 }
            );

            expect(execution.error).toMatchObject({ code: "ENOBUFS" });
            expect(execution.cleanupError).toBeUndefined();
            expect(execution.status === 0 && execution.signal === null).toBe(
                false
            );
        });

        test("kills descendants together with a timed-out worker", async () => {
            const source = [
                'const { spawn } = require("node:child_process");',
                "const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 5_000)'], { stdio: 'ignore' });",
                "process.stdout.write(String(child.pid) + '\\n');",
                "setInterval(() => {}, 1_000);"
            ].join("\n");
            const execution = await executeNode(source, { timeoutMs: 500 });
            const descendantPid = Number(execution.stdout.trim());

            try {
                expect(execution.error).toMatchObject({ code: "ETIMEDOUT" });
                expect(execution.cleanupError).toBeUndefined();
                expect(descendantPid).toBeGreaterThan(0);
                expect(processExists(descendantPid)).toBe(false);
            } finally {
                if (processExists(descendantPid)) killProcess(descendantPid);
            }
        });

        test("does not let inherited descendant pipes extend the hard timeout", async () => {
            const source = [
                'const { spawn } = require("node:child_process");',
                "spawn(process.execPath, ['-e', 'setTimeout(() => {}, 2_000)'], { stdio: ['ignore', 'inherit', 'inherit'] });",
                "setInterval(() => {}, 1_000);"
            ].join("\n");
            const startedAt = performance.now();
            const execution = await executeNode(source, { timeoutMs: 500 });
            const elapsedMs = performance.now() - startedAt;

            expect(execution.error).toMatchObject({ code: "ETIMEDOUT" });
            expect(execution.cleanupError).toBeUndefined();
            expect(elapsedMs).toBeLessThan(1_850);
        });

        test("kills inherited-pipe descendants after the worker root exits", async () => {
            const source = [
                'const { spawn } = require("node:child_process");',
                "const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 2_000)'], { stdio: ['ignore', 'inherit', 'inherit'] });",
                "process.stdout.write(String(child.pid) + '\\n', () => process.exit(0));"
            ].join("\n");
            const startedAt = performance.now();
            const execution = await executeNode(source, { timeoutMs: 500 });
            const elapsedMs = performance.now() - startedAt;
            const descendantPid = Number(execution.stdout.trim());

            try {
                expect(execution).toMatchObject({
                    status: 0,
                    signal: null,
                    error: undefined,
                    cleanupError: undefined
                });
                expect(descendantPid).toBeGreaterThan(0);
                expect(processExists(descendantPid)).toBe(false);
                expect(elapsedMs).toBeLessThan(1_350);
            } finally {
                if (processExists(descendantPid)) killProcess(descendantPid);
            }
        });

        test("kills descendants together with an overflowing worker", async () => {
            const source = [
                'const { spawn } = require("node:child_process");',
                "const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 5_000)'], { stdio: 'ignore' });",
                "process.stderr.write(String(child.pid) + '\\n');",
                'process.stdout.write("x".repeat(2_048));',
                "setInterval(() => {}, 1_000);"
            ].join("\n");
            const execution = await executeNode(source, {
                maxBufferBytes: 128,
                timeoutMs: 500
            });
            const descendantPid = Number(execution.stderr.trim());

            try {
                expect(execution.error).toMatchObject({ code: "ENOBUFS" });
                expect(execution.cleanupError).toBeUndefined();
                expect(descendantPid).toBeGreaterThan(0);
                expect(processExists(descendantPid)).toBe(false);
            } finally {
                if (processExists(descendantPid)) killProcess(descendantPid);
            }
        });
    }
);
