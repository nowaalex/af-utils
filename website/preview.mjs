import { spawn } from "node:child_process";
import { resolvePackageBin } from "./package-bin.mjs";

const child = spawn(
    process.execPath,
    [resolvePackageBin("astro", "astro"), "preview", ...process.argv.slice(2)],
    { stdio: "inherit" }
);
const signalHandlers = new Map(
    ["SIGINT", "SIGTERM"].map(signal => [signal, () => child.kill(signal)])
);

for (const [forwardedSignal, handler] of signalHandlers) {
    process.once(forwardedSignal, handler);
}

const { code, signal } = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (exitCode, exitSignal) =>
        resolve({ code: exitCode, signal: exitSignal })
    );
});

for (const [forwardedSignal, handler] of signalHandlers) {
    process.removeListener(forwardedSignal, handler);
}

if (signal) process.kill(process.pid, signal);
else process.exitCode = code ?? 1;
