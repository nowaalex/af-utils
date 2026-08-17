import { spawn } from "node:child_process";

/** Normalized child-process result shared by runtime and probe orchestration. */
export interface ProcessExecution {
    stdout: string;
    stderr: string;
    error?: Error & { code?: string };
    status: number | null;
    signal: NodeJS.Signals | null;
}

/** Options for one buffered, hard-timeout child process. */
export interface ExecuteProcessOptions {
    cwd: string;
    environment: NodeJS.ProcessEnv;
    maxBufferBytes: number;
    timeoutMs: number;
}

const processError = (message: string, code: string) =>
    Object.assign(new Error(message), { code });

/** Spawn one process and retain the failure contract previously supplied by spawnSync. */
export const executeProcess = (
    command: readonly string[],
    options: ExecuteProcessOptions
): Promise<ProcessExecution> =>
    new Promise(resolve => {
        const child = spawn(command[0], command.slice(1), {
            cwd: options.cwd,
            env: options.environment,
            shell: false,
            stdio: ["ignore", "pipe", "pipe"]
        });
        let stdout = "";
        let stderr = "";
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let error: ProcessExecution["error"];
        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        const capture = (chunk: string, stream: "stdout" | "stderr") => {
            if (error?.code === "ENOBUFS") return;
            const chunkBytes = Buffer.byteLength(chunk);
            if (stream === "stdout") {
                stdout += chunk;
                stdoutBytes += chunkBytes;
            } else {
                stderr += chunk;
                stderrBytes += chunkBytes;
            }
            if (
                stdoutBytes > options.maxBufferBytes ||
                stderrBytes > options.maxBufferBytes
            ) {
                error = processError(
                    `Child process output exceeded ${options.maxBufferBytes} bytes`,
                    "ENOBUFS"
                );
                child.kill("SIGKILL");
            }
        };
        child.stdout.on("data", (chunk: string) => capture(chunk, "stdout"));
        child.stderr.on("data", (chunk: string) => capture(chunk, "stderr"));
        child.once("error", value => {
            error ??= value;
        });
        const timeout = setTimeout(() => {
            error ??= processError(
                `Child process exceeded the ${options.timeoutMs}ms timeout`,
                "ETIMEDOUT"
            );
            child.kill("SIGKILL");
        }, options.timeoutMs);
        child.once("close", (status, signal) => {
            clearTimeout(timeout);
            // oxlint-disable-next-line promise/no-multiple-resolved -- The close listener is registered with `once` and is the sole terminal resolver.
            resolve({ stdout, stderr, error, status, signal });
        });
    });
