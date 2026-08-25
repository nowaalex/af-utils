import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";

import type { WindowsProcessJob } from "./windows-process-job.js";

/** Maximum time reserved for terminating a worker process tree. */
export const PROCESS_CLEANUP_GRACE_MS = 1_000;

/** Normalized child-process result shared by runtime and probe orchestration. */
export interface ProcessExecution {
    stdout: string;
    stderr: string;
    error?: Error & { code?: string };
    cleanupError?: Error & { code?: string };
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

interface WindowsWrapperMessage {
    type: "ready" | "completed";
    status?: number | null;
    signal?: NodeJS.Signals | null;
    error?: { message: string; code?: string };
}

const isWindowsWrapperMessage = (
    value: unknown
): value is WindowsWrapperMessage =>
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value.type === "ready" || value.type === "completed");

const WINDOWS_PROCESS_WRAPPER_SOURCE = String.raw`
const { spawn } = require("node:child_process");
let started = false;
let completed = false;
process.on("message", message => {
    if (started || message?.type !== "start") return;
    started = true;
    const child = spawn(message.command[0], message.command.slice(1), {
        cwd: message.cwd,
        env: message.environment,
        shell: false,
        stdio: ["ignore", "inherit", "inherit"],
        windowsHide: true
    });
    const finish = value => {
        if (completed) return;
        completed = true;
        process.send?.({ type: "completed", ...value });
    };
    child.once("error", error => finish({
        status: null,
        signal: null,
        error: { message: error.message, code: error.code }
    }));
    child.once("exit", (status, signal) => finish({ status, signal }));
});
process.send?.({ type: "ready" });
setInterval(() => {}, 2_147_483_647);
`;

const createWindowsProcessJob =
    process.platform === "win32"
        ? (await import("./windows-process-job.js")).createWindowsProcessJob
        : undefined;

const processError = (message: string, code: string) =>
    Object.assign(new Error(message), { code });

const cleanupFailure = (message: string) => processError(message, "ECLEANUP");

const delay = (milliseconds: number) =>
    new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });

const remaining = (deadline: number) => Math.max(0, deadline - Date.now());

const processGroupExists = (pid: number) => {
    try {
        process.kill(-pid, 0);
        return true;
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ESRCH") return false;
        if (code === "EPERM") return true;
        throw error;
    }
};

const waitForProcessGroupExit = async (pid: number, deadline: number) => {
    while (processGroupExists(pid) && remaining(deadline) > 0) {
        // oxlint-disable-next-line no-await-in-loop -- Process-group exit is an OS state transition polled only during bounded cleanup.
        await delay(Math.min(10, remaining(deadline)));
    }
    return !processGroupExists(pid);
};

const terminatePosixTree = async (pid: number, deadline: number) => {
    try {
        process.kill(-pid, "SIGKILL");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
            return cleanupFailure(
                `Failed to kill process group ${pid}: ${(error as Error).message}`
            );
        }
    }
    if (await waitForProcessGroupExit(pid, deadline)) return;
    return cleanupFailure(
        `Process group ${pid} remained alive after ${PROCESS_CLEANUP_GRACE_MS}ms`
    );
};

const terminateWindowsTree = async (
    child: ChildProcess,
    job: WindowsProcessJob,
    assigned: boolean,
    deadline: number
) => {
    let error: Error | undefined;
    if (assigned) {
        try {
            job.terminate();
            while (job.activeProcessCount() > 0 && remaining(deadline) > 0) {
                // oxlint-disable-next-line no-await-in-loop -- Job completion is an OS state transition polled only during bounded cleanup.
                await delay(Math.min(10, remaining(deadline)));
            }
            if (job.activeProcessCount() > 0) {
                error = cleanupFailure(
                    `Windows worker Job Object remained active after ${PROCESS_CLEANUP_GRACE_MS}ms`
                );
            }
        } catch (value) {
            error = cleanupFailure(
                `Failed to terminate the Windows worker Job Object: ${(value as Error).message}`
            );
        }
    } else {
        child.kill("SIGKILL");
    }
    try {
        job.close();
    } catch (value) {
        error ??= cleanupFailure(
            `Failed to close the Windows worker Job Object: ${(value as Error).message}`
        );
    }
    return error;
};

const terminateProcessTree = async (
    child: ChildProcess,
    deadline: number,
    windowsJob: WindowsProcessJob | undefined,
    windowsJobAssigned: boolean
) => {
    if (windowsJob) {
        return terminateWindowsTree(
            child,
            windowsJob,
            windowsJobAssigned,
            deadline
        );
    }
    const pid = child.pid;
    if (pid === undefined) {
        child.kill("SIGKILL");
        return;
    }
    const cleanupError = await terminatePosixTree(pid, deadline);
    return cleanupError;
};

/** Spawn one process, bound its output, and contain its OS-bound descendants. */
export const executeProcess = async (
    command: readonly string[],
    options: ExecuteProcessOptions
): Promise<ProcessExecution> => {
    let windowsJob: WindowsProcessJob | undefined;
    if (createWindowsProcessJob) {
        try {
            windowsJob = createWindowsProcessJob();
        } catch (error) {
            return {
                stdout: "",
                stderr: "",
                cleanupError: cleanupFailure(
                    `Failed to create the Windows worker Job Object: ${(error as Error).message}`
                ),
                status: null,
                signal: null
            };
        }
    }

    return await new Promise(resolve => {
        const child = windowsJob
            ? spawn(process.execPath, ["-e", WINDOWS_PROCESS_WRAPPER_SOURCE], {
                  cwd: options.cwd,
                  env: {
                      ...process.env,
                      NODE_OPTIONS: undefined,
                      NODE_PATH: undefined
                  },
                  shell: false,
                  stdio: ["ignore", "pipe", "pipe", "ipc"],
                  windowsHide: true
              })
            : spawn(command[0], command.slice(1), {
                  cwd: options.cwd,
                  detached: true,
                  env: options.environment,
                  shell: false,
                  stdio: ["ignore", "pipe", "pipe"],
                  windowsHide: true
              });
        let stdout = "";
        let stderr = "";
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let error: ProcessExecution["error"];
        let cleanupError: ProcessExecution["cleanupError"];
        let status: number | null = null;
        let signal: NodeJS.Signals | null = null;
        let closed = false;
        let settled = false;
        let terminating = false;
        let windowsJobAssigned = false;
        let windowsWorkerCompleted = false;
        let resolveClose: (() => void) | undefined;
        const stdoutStream = child.stdout!;
        const stderrStream = child.stderr!;
        const closePromise = new Promise<void>(closeResolve => {
            resolveClose = closeResolve;
        });

        stdoutStream.setEncoding("utf8");
        stderrStream.setEncoding("utf8");

        const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve({
                stdout,
                stderr,
                error,
                cleanupError,
                status,
                signal
            });
        };

        const terminate = (failure?: Error & { code?: string }) => {
            error ??= failure;
            if (terminating || settled) return;
            terminating = true;
            clearTimeout(timeout);
            const deadline = Date.now() + PROCESS_CLEANUP_GRACE_MS;
            void (async () => {
                cleanupError ??= await terminateProcessTree(
                    child,
                    deadline,
                    windowsJob,
                    windowsJobAssigned
                );
                if (!closed && remaining(deadline) > 0) {
                    await Promise.race([
                        closePromise,
                        delay(remaining(deadline))
                    ]);
                }
                if (!closed) {
                    cleanupError ??= cleanupFailure(
                        `Worker streams remained open after ${PROCESS_CLEANUP_GRACE_MS}ms of cleanup`
                    );
                    stdoutStream.destroy();
                    stderrStream.destroy();
                }
                if (!windowsWorkerCompleted) {
                    status = child.exitCode;
                    signal = child.signalCode;
                }
                finish();
            })();
        };

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
                terminate(
                    processError(
                        `Child process output exceeded ${options.maxBufferBytes} bytes`,
                        "ENOBUFS"
                    )
                );
            }
        };

        stdoutStream.on("data", (chunk: string) => capture(chunk, "stdout"));
        stderrStream.on("data", (chunk: string) => capture(chunk, "stderr"));
        child.once("error", value => {
            error ??= value;
            terminate();
        });
        child.once("exit", (nextStatus, nextSignal) => {
            if (windowsJob) return;
            status = nextStatus;
            signal = nextSignal;
            terminate();
        });
        child.once("close", (nextStatus, nextSignal) => {
            closed = true;
            if (!windowsWorkerCompleted) {
                status = nextStatus;
                signal = nextSignal;
            }
            resolveClose?.();
            if (!terminating && windowsJob) {
                error ??= processError(
                    "Windows worker wrapper exited before reporting a result",
                    "ECHILD"
                );
                terminate();
            }
        });
        if (windowsJob) {
            child.on("message", (value: unknown) => {
                if (!isWindowsWrapperMessage(value)) return;
                if (value.type === "ready") {
                    try {
                        const pid = child.pid;
                        if (pid === undefined) {
                            throw new Error(
                                "Windows wrapper has no process ID"
                            );
                        }
                        windowsJob.assign(pid);
                        windowsJobAssigned = true;
                        child.send?.(
                            {
                                type: "start",
                                command,
                                cwd: options.cwd,
                                environment: options.environment
                            },
                            sendError => {
                                if (!sendError) return;
                                error ??= sendError;
                                terminate();
                            }
                        );
                    } catch (nextError) {
                        cleanupError = cleanupFailure(
                            `Failed to contain the Windows worker: ${(nextError as Error).message}`
                        );
                        terminate();
                    }
                    return;
                }
                if (value.type === "completed" && !windowsWorkerCompleted) {
                    windowsWorkerCompleted = true;
                    status = value.status ?? null;
                    signal = value.signal ?? null;
                    if (value.error) {
                        error = Object.assign(new Error(value.error.message), {
                            code: value.error.code
                        });
                    }
                    terminate();
                }
            });
        }
        const timeout = setTimeout(() => {
            terminate(
                processError(
                    `Child process exceeded the ${options.timeoutMs}ms timeout`,
                    "ETIMEDOUT"
                )
            );
        }, options.timeoutMs);
    });
};
