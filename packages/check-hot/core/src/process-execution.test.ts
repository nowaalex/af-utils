import { describe, expect, test } from "vitest";

import { executeProcess } from "./process-execution.js";

const executeNode = (source: string, maxBufferBytes = 1024) =>
    executeProcess([process.execPath, "-e", source], {
        cwd: process.cwd(),
        environment: process.env,
        maxBufferBytes,
        timeoutMs: 500
    });

describe.runIf(process.env.CODEX_PERMISSION_PROFILE === undefined)(
    "asynchronous process execution",
    () => {
        test("captures successful output and exit status", async () => {
            const execution = await executeNode(
                'process.stdout.write("result"); process.stderr.write("trace")'
            );

            expect(execution).toMatchObject({
                stdout: "result",
                stderr: "trace",
                status: 0,
                signal: null,
                error: undefined
            });
        });

        test("hard-kills timeouts with the established error code", async () => {
            const execution = await executeNode("while (true) {};");

            expect(execution.error).toMatchObject({ code: "ETIMEDOUT" });
            expect(execution.signal).toBe("SIGKILL");
        });

        test("hard-kills output that exceeds the shared buffer", async () => {
            const execution = await executeNode(
                'process.stdout.write("x".repeat(2048))',
                128
            );

            expect(execution.error).toMatchObject({ code: "ENOBUFS" });
            expect(execution.signal).toBe("SIGKILL");
        });
    }
);
