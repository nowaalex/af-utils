import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import "./build.mjs";
import {
    getHotPathMethodNames,
    HOT_PATHS,
    PRIVATE_FIELD_HOT_PATHS
} from "./hot-paths.mjs";

const inspect = process.argv.includes("--inspect");
const checks = inspect
    ? [
          {
              file: "check-representations.mjs",
              scriptArguments: ["--debug-print"]
          }
      ]
    : [
          { file: "check-representations.mjs" },
          {
              file: "check-monomorphism.mjs",
              hotPaths: HOT_PATHS,
              traceDeoptimization: true
          },
          {
              file: "check-private-fields.mjs",
              hotPaths: PRIVATE_FIELD_HOT_PATHS,
              traceDeoptimization: true
          }
      ];

const escapeRegExp = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findTargetDeoptimizations = (output, definitions) => {
    const functionPatterns = getHotPathMethodNames(definitions).map(
        (method) =>
            new RegExp(
                `<(?:JSFunction|SharedFunctionInfo) ${escapeRegExp(method)}(?:\\s|>)`
            )
    );

    return output
        .split(/\r?\n/)
        .filter(
            (line) =>
                (line.includes("deoptimizing") ||
                    line.includes("for deoptimization")) &&
                functionPatterns.some((pattern) => pattern.test(line))
        );
};

for (const {
    file,
    hotPaths,
    scriptArguments = [],
    traceDeoptimization = false
} of checks) {
    const nodeArguments = ["--allow-natives-syntax"];
    if (traceDeoptimization) nodeArguments.push("--trace-deopt");
    nodeArguments.push(resolve(import.meta.dirname, file), ...scriptArguments);

    const result = spawnSync(process.execPath, nodeArguments, {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");

    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);

    if (hotPaths) {
        const deoptimizations = findTargetDeoptimizations(output, hotPaths);
        if (deoptimizations.length > 0) {
            throw new Error(
                `V8 deoptimized a guarded hot path:\n${deoptimizations.join("\n")}`
            );
        }
    }
}
