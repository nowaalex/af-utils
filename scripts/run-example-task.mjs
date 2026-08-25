import { spawn } from "node:child_process";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";
import { discoverExamples } from "../examples/discovery.ts";

const repositoryRoot = resolve(import.meta.dirname, "..");
const binariesDirectory = resolve(repositoryRoot, "examples/node_modules/.bin");
const nativeTypeScript = resolve(
    repositoryRoot,
    "examples/node_modules/@typescript/native/bin/tsc"
);
const task = process.argv[2];

if (task !== "build" && task !== "typecheck") {
    throw new Error("Expected an example task: build or typecheck");
}

const getTypecheckCommand = framework => {
    if (framework === "svelte") {
        return ["svelte-check", "--tsconfig", "./tsconfig.json"];
    }
    if (framework === "vue") return ["vue-tsc", "--noEmit"];
    return [process.execPath, nativeTypeScript, "--noEmit"];
};

const runCommand = (directory, [command, ...args]) =>
    new Promise((resolvePromise, reject) => {
        const child = spawn(resolve(binariesDirectory, command), args, {
            cwd: directory,
            stdio: "inherit"
        });
        child.on("error", reject);
        child.on("exit", (code, signal) => {
            if (code === 0) {
                resolvePromise();
                return;
            }
            reject(
                new Error(
                    `${command} failed in ${directory} (${signal ?? code})`
                )
            );
        });
    });

const examples = await discoverExamples();
let cursor = 0;
const failures = [];
const worker = async () => {
    const example = examples[cursor++];
    if (!example) return;
    const command =
        task === "build"
            ? ["vite", "build", "--logLevel", "warn"]
            : getTypecheckCommand(example.framework);
    try {
        await runCommand(example.directory, command);
    } catch (error) {
        failures.push(error);
    }
    await worker();
};

await Promise.all(
    Array.from(
        { length: Math.min(examples.length, availableParallelism(), 6) },
        worker
    )
);

if (failures.length > 0) {
    throw new AggregateError(
        failures,
        `${task} failed for ${failures.length} standalone examples`
    );
}

console.log(`${task} passed for ${examples.length} standalone examples`);
