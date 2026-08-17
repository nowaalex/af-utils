#!/usr/bin/env node

import { access, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { formatHotRunSummary } from "./report.js";
import { runHotSuite } from "./runner.js";
import { mapWithConcurrency } from "./concurrency.js";
import type {
    HotDiagnosticKind,
    HotRunMode,
    HotRuntimeName,
    V8Tier
} from "./types.js";

const help = `Usage:
  check-hot <suite.mjs> [run options]
  check-hot run <suite.mjs> [run options]
  check-hot analyze <path-or-package> [analysis options]
  check-hot init <path-or-package> [generation options]
  check-hot report <artifact-directory> [--verbose]

Run options:
  --runtime <list>    node,deno,bun (comma-separated)
  --tier <list>       maglev,turbofan (comma-separated)
  --mode <list>       combined,isolated (comma-separated)
  --scenario <list>   Run only selected scenario IDs (comma-separated)
  --repeat <n>        Fresh-process repetitions per matrix cell
  --concurrency <n>   Maximum concurrent matrix cells (default: 1)
  --warmup <n>        Override warmup iterations per scenario
  --stress <n>        Override guarded-stress iterations per scenario
  --timeout <n>       Hard timeout for each worker process in milliseconds
  --deopts <scope>    all,targets,none (default: targets)
  --json <path>       Write the complete machine-readable result
  --artifacts <dir>   Write a new offline-inspectable artifact bundle
  --diagnostics <l>   v8-ic-maps,cpu-profile,jsc-sampling, or all
  --diagnostic-stress <l> Per-kind budgets, for example v8-ic-maps=1000,cpu-profile=50000
  --diagnostic-max-bytes <n> Maximum bytes loaded from one profile/log
  --color <policy>    auto,always,never (default: auto)
  --inspect           Enable suite representation diagnostics
  --verbose           Include target statuses and raw engine diagnostics

Analysis options:
  --top <n>           Number of ranked candidates to print (default: 20)
  --max-files <n>     Module-graph file limit (default: 5000)
  --runtime <r>       Conditional exports to analyze: node, deno, bun
  --color <policy>    auto,always,never (default: auto)
  --code-frame        Show colored source lines and caret ranges
  --json <path>       Write the complete machine-readable analysis

Generation options:
  --out <path>        Generated suite path (default: check-hot.suite.mjs)
  --top <n>           Maximum exports (default: all probed; 50 TODO entries)
  --max-files <n>     Module-graph file limit (default: 5000)
  --probe             Select successful recipes in a disposable runtime process
  --probe-runtime <r> node, deno, or bun (default: node)
  --function <list>   Probe only these public runtime functions (comma-separated)
  --test-runner <id>  External recipe package/module; required with --probe
  --probe-timeout <n> Hard timeout for discovery and each recipe process (default: 15000)
  --concurrency <n>   Maximum concurrent probe coordinates (default: 1)
  --allow-incomplete  Generate despite unresolved, truncated, or unauthenticated external graph edges
  --force             Overwrite an existing output file

Runtime paths may be set with CHECK_HOT_NODE, CHECK_HOT_DENO, and CHECK_HOT_BUN.
`;

const split = <Value extends string>(value: string | undefined) =>
    value?.split(",").filter(Boolean) as Value[] | undefined;

const optionalNumber = (value: string | undefined, label: string) => {
    if (value === undefined) return;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`${label} must be a positive integer`);
    }
    return parsed;
};

const diagnosticStressIterations = (value: string | undefined) => {
    if (value === undefined) return;
    const result: Partial<Record<HotDiagnosticKind, number>> = {};
    for (const entry of value.split(",")) {
        const separator = entry.indexOf("=");
        if (separator <= 0 || separator === entry.length - 1) {
            throw new Error(
                "diagnostic-stress must contain kind=positive-integer entries"
            );
        }
        const kind = entry.slice(0, separator) as HotDiagnosticKind;
        if (Object.hasOwn(result, kind)) {
            throw new Error(`diagnostic-stress repeats ${kind}`);
        }
        result[kind] = optionalNumber(
            entry.slice(separator + 1),
            `diagnostic-stress ${kind}`
        );
    }
    return result;
};

const isLocalInput = async (input: string) => {
    if (input.startsWith("file:")) return true;
    try {
        await access(resolve(input));
        return true;
    } catch {
        return false;
    }
};

const assertCoreResolvableFromOutput = (output: string) => {
    try {
        createRequire(pathToFileURL(output)).resolve("@af-utils/check-hot");
    } catch (error) {
        throw new Error(
            `Generated suite ${output} cannot resolve @af-utils/check-hot. Install the core package in the consumer project and choose --out inside that dependency tree.`,
            { cause: error }
        );
    }
};

const runCommand = async (argumentsValue: readonly string[]) => {
    const parsed = parseArgs({
        args: [...argumentsValue],
        allowPositionals: true,
        options: {
            runtime: { type: "string" },
            tier: { type: "string" },
            mode: { type: "string" },
            scenario: { type: "string" },
            repeat: { type: "string" },
            concurrency: { type: "string" },
            warmup: { type: "string" },
            stress: { type: "string" },
            timeout: { type: "string" },
            deopts: { type: "string" },
            json: { type: "string" },
            artifacts: { type: "string" },
            diagnostics: { type: "string" },
            "diagnostic-stress": { type: "string" },
            "diagnostic-max-bytes": { type: "string" },
            color: { type: "string" },
            inspect: { type: "boolean" },
            verbose: { type: "boolean" },
            help: { type: "boolean", short: "h" }
        }
    });
    if (parsed.values.help) {
        console.log(help);
        return;
    }
    const suite = parsed.positionals[0];
    if (!suite) throw new Error(`Missing suite module path\n\n${help}`);
    const color = parsed.values.color ?? "auto";
    if (!["auto", "always", "never"].includes(color)) {
        throw new Error("color must be auto, always, or never");
    }
    const diagnosticValues =
        parsed.values.diagnostics === "all"
            ? (["v8-ic-maps", "cpu-profile", "jsc-sampling"] as const)
            : split<"v8-ic-maps" | "cpu-profile" | "jsc-sampling">(
                  parsed.values.diagnostics
              );
    const summary = await runHotSuite({
        suite,
        scenarios: split(parsed.values.scenario),
        runtimes: split<HotRuntimeName>(parsed.values.runtime),
        v8Tiers: split<V8Tier>(parsed.values.tier),
        modes: split<HotRunMode>(parsed.values.mode),
        repetitions: optionalNumber(parsed.values.repeat, "repeat"),
        concurrency: optionalNumber(parsed.values.concurrency, "concurrency"),
        warmupIterations: optionalNumber(parsed.values.warmup, "warmup"),
        stressIterations: optionalNumber(parsed.values.stress, "stress"),
        timeoutMs: optionalNumber(parsed.values.timeout, "timeout"),
        deoptScope: parsed.values.deopts as
            | "all"
            | "targets"
            | "none"
            | undefined,
        inspect: parsed.values.inspect,
        verbose: parsed.values.verbose,
        jsonOutput: parsed.values.json,
        artifactOutput: parsed.values.artifacts,
        diagnostics: diagnosticValues,
        diagnosticStressIterations: diagnosticStressIterations(
            parsed.values["diagnostic-stress"]
        ),
        diagnosticMaxBytes: optionalNumber(
            parsed.values["diagnostic-max-bytes"],
            "diagnostic-max-bytes"
        )
    });
    console.log(
        formatHotRunSummary(summary, {
            verbose: parsed.values.verbose,
            color: color as "auto" | "always" | "never"
        })
    );
    if (!summary.passed) process.exitCode = 1;
};

const reportCommand = async (argumentsValue: readonly string[]) => {
    const parsed = parseArgs({
        args: [...argumentsValue],
        allowPositionals: true,
        options: {
            color: { type: "string" },
            verbose: { type: "boolean" },
            help: { type: "boolean", short: "h" }
        }
    });
    if (parsed.values.help) {
        console.log(
            "Usage: check-hot report <artifact-directory> [--verbose] [--color auto|always|never]"
        );
        return;
    }
    const input = parsed.positionals[0];
    if (!input) throw new Error("Missing artifact directory");
    const color = parsed.values.color ?? "auto";
    if (!["auto", "always", "never"].includes(color)) {
        throw new Error("color must be auto, always, or never");
    }
    const { readHotArtifactBundle } = await import("./artifacts/index.js");
    const { summary } = await readHotArtifactBundle(input);
    console.log(
        formatHotRunSummary(summary, {
            verbose: parsed.values.verbose,
            color: color as "auto" | "always" | "never"
        })
    );
    if (!summary.passed) process.exitCode = 1;
};

const analyzeCommand = async (argumentsValue: readonly string[]) => {
    const parsed = parseArgs({
        args: [...argumentsValue],
        allowPositionals: true,
        options: {
            top: { type: "string" },
            "max-files": { type: "string" },
            runtime: { type: "string" },
            color: { type: "string" },
            "code-frame": { type: "boolean" },
            json: { type: "string" },
            help: { type: "boolean", short: "h" }
        }
    });
    if (parsed.values.help) {
        console.log(help);
        return;
    }
    const input = parsed.positionals[0];
    if (!input) throw new Error(`Missing path or package specifier\n\n${help}`);
    const color = parsed.values.color ?? "auto";
    if (!["auto", "always", "never"].includes(color)) {
        throw new Error("color must be auto, always, or never");
    }
    const { analyzeHotModule, formatHotAnalysis } =
        await import("./analyzer.js");
    const runtime = parsed.values.runtime ?? "node";
    if (!["node", "deno", "bun"].includes(runtime)) {
        throw new Error("runtime must be node, deno, or bun");
    }
    const report = await analyzeHotModule({
        input,
        runtime: runtime as HotRuntimeName,
        maxFiles: optionalNumber(parsed.values["max-files"], "max-files")
    });
    if (parsed.values.json) {
        const output = resolve(parsed.values.json);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
    }
    console.log(
        formatHotAnalysis(report, {
            top: optionalNumber(parsed.values.top, "top") ?? 20,
            color: color as "auto" | "always" | "never",
            codeFrame: parsed.values["code-frame"]
        })
    );
};

const initCommand = async (argumentsValue: readonly string[]) => {
    const parsed = parseArgs({
        args: [...argumentsValue],
        allowPositionals: true,
        options: {
            out: { type: "string" },
            top: { type: "string" },
            "max-files": { type: "string" },
            "probe-timeout": { type: "string" },
            concurrency: { type: "string" },
            "probe-runtime": { type: "string" },
            function: { type: "string" },
            "allow-incomplete": { type: "boolean" },
            "test-runner": { type: "string" },
            probe: { type: "boolean" },
            force: { type: "boolean" },
            help: { type: "boolean", short: "h" }
        }
    });
    if (parsed.values.help) {
        console.log(help);
        return;
    }
    const input = parsed.positionals[0];
    if (!input) throw new Error(`Missing path or package specifier\n\n${help}`);
    const output = resolve(parsed.values.out ?? "check-hot.suite.mjs");
    assertCoreResolvableFromOutput(output);
    const probeRuntime = parsed.values["probe-runtime"] ?? "node";
    if (!["node", "deno", "bun"].includes(probeRuntime)) {
        throw new Error("probe-runtime must be node, deno, or bun");
    }
    const {
        analyzeHotModule,
        generateHotSuiteSource,
        hotAnalysisPathFromUrl,
        mergeHotModuleProbeManifests,
        probeHotModule,
        relativeImportSpecifier,
        resolveHotTestRunner
    } = await import("./analyzer.js");
    const report = await analyzeHotModule({
        input,
        runtime: probeRuntime as HotRuntimeName,
        maxFiles: optionalNumber(parsed.values["max-files"], "max-files"),
        ignorePackageFiles: [output]
    });
    if (!report.graphComplete && !parsed.values["allow-incomplete"]) {
        throw new Error(
            `Refusing to generate from an incomplete module graph (${report.diagnostics.length} diagnostic(s)); fix the edges or pass --allow-incomplete to record an explicit exception`
        );
    }
    const localInput = await isLocalInput(input);
    // Local targets remain physically pinned. Installed packages retain their
    // public request so each worker can compare native resolution with the
    // analyzer-selected package-relative artifact and source hash.
    const importSpecifier = localInput
        ? relativeImportSpecifier(report.entry, output)
        : input;
    const analyzedPackageRoot = resolve(
        report.entry,
        ...report.entryPackagePath.split("/").map(() => "..")
    );
    const moduleSpecifiers = report.publicEntries.map(entry => ({
        modulePath: entry.modulePath,
        importSpecifier:
            localInput || !report.packageName
                ? relativeImportSpecifier(
                      resolve(analyzedPackageRoot, entry.entryPackagePath),
                      output
                  )
                : entry.modulePath === "."
                  ? importSpecifier
                  : `${report.packageName}${entry.modulePath.slice(1)}`
    }));
    const probeTimeout = optionalNumber(
        parsed.values["probe-timeout"],
        "probe-timeout"
    );
    const probeConcurrency =
        optionalNumber(parsed.values.concurrency, "concurrency") ?? 1;
    const testRunnerSpecifier = parsed.values["test-runner"];
    if (parsed.values.probe && !testRunnerSpecifier) {
        throw new Error("--test-runner is required with --probe");
    }
    if (!parsed.values.probe && testRunnerSpecifier) {
        throw new Error("--test-runner is only used together with --probe");
    }
    if (!parsed.values.probe && parsed.values.function) {
        throw new Error("--function is only used together with --probe");
    }
    if (!parsed.values.probe && parsed.values.concurrency) {
        throw new Error("--concurrency is only used together with --probe");
    }
    const probeFunctions = split<string>(parsed.values.function);
    if (parsed.values.function && probeFunctions?.length === 0) {
        throw new Error("function must contain at least one public name");
    }
    const resolvedTestRunner = testRunnerSpecifier
        ? await resolveHotTestRunner(
              testRunnerSpecifier,
              probeRuntime as HotRuntimeName
          )
        : undefined;
    const localTestRunner = testRunnerSpecifier
        ? await isLocalInput(testRunnerSpecifier)
        : false;
    const generatedTestRunner = resolvedTestRunner
        ? localTestRunner
            ? relativeImportSpecifier(
                  hotAnalysisPathFromUrl(new URL(resolvedTestRunner)),
                  output
              )
            : testRunnerSpecifier
        : undefined;
    const selectedTop = optionalNumber(parsed.values.top, "top");
    const selectedCandidates = report.candidates
        .filter(candidate => candidate.targetId)
        .filter(
            candidate =>
                !probeFunctions ||
                probeFunctions.includes(candidate.targetId as string) ||
                probeFunctions.includes(candidate.name) ||
                (candidate.exportName
                    ? probeFunctions.includes(candidate.exportName)
                    : false)
        )
        .slice(0, selectedTop ?? Number.POSITIVE_INFINITY);
    const selectedModulePaths = new Set([
        ...(selectedCandidates.length === 0 ? ["."] : []),
        ...selectedCandidates.flatMap(candidate =>
            candidate.publicTargets.map(target => target.modulePath)
        )
    ]);
    const probeManifests = parsed.values.probe
        ? (
              await mapWithConcurrency(
                  report.publicEntries.filter(entry =>
                      selectedModulePaths.has(entry.modulePath)
                  ),
                  1,
                  async entry => {
                      const entryFunctions = probeFunctions
                          ? [
                                ...new Set(
                                    selectedCandidates.flatMap(candidate =>
                                        candidate.publicTargets.some(
                                            target =>
                                                target.modulePath ===
                                                entry.modulePath
                                        )
                                            ? candidate.publicTargets
                                                  .filter(
                                                      target =>
                                                          target.modulePath ===
                                                              entry.modulePath &&
                                                          target.exportPath
                                                              .length === 1
                                                  )
                                                  .map(
                                                      target =>
                                                          target.exportPath[0]
                                                  )
                                            : []
                                    )
                                )
                            ]
                          : undefined;
                      if (
                          probeFunctions &&
                          entry.modulePath !== "." &&
                          entryFunctions?.length === 0
                      ) {
                          return;
                      }
                      const entryFile = resolve(
                          analyzedPackageRoot,
                          entry.entryPackagePath
                      );
                      const manifest = await probeHotModule({
                          // Each public entry is probed in disposable processes;
                          // manifest keys are qualified only after the adapter ran.
                          specifier: pathToFileURL(entryFile).href,
                          modulePath: entry.modulePath,
                          parentUrl: pathToFileURL(output).href,
                          testRunnerSpecifier: resolvedTestRunner as string,
                          package: {
                              name: report.packageName,
                              version: report.packageVersion
                          },
                          ...(entryFunctions && entryFunctions.length > 0
                              ? { functions: entryFunctions }
                              : entry.modulePath === "." && probeFunctions
                                ? { functions: probeFunctions }
                                : {}),
                          runtime: probeRuntime as HotRuntimeName,
                          concurrency: probeConcurrency,
                          ...(probeTimeout ? { timeoutMs: probeTimeout } : {})
                      });
                      return manifest;
                  }
              )
          ).filter(manifest => manifest !== undefined)
        : [];
    const probeManifest =
        probeManifests.length > 0
            ? mergeHotModuleProbeManifests(probeManifests)
            : undefined;
    const source = generateHotSuiteSource(report, {
        importSpecifier,
        moduleSpecifiers,
        testRunnerSpecifier: generatedTestRunner,
        probeManifest,
        functions: probeFunctions,
        top: selectedTop
    });
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, source, {
        flag: parsed.values.force ? "w" : "wx"
    });
    const acceptedRecipes = probeManifest
        ? Object.values(probeManifest.samples).reduce(
              (total, labels) => total + labels.length,
              0
          )
        : 0;
    console.log(
        `Generated ${output} with ${probeManifest ? `${acceptedRecipes} accepted recipe(s) from ${probeManifest.attempts?.length ?? acceptedRecipes} visible attempt(s) by ${probeManifest.runnerId}@${probeManifest.runnerVersion} on ${probeManifest.runtime.name}@${probeManifest.runtime.version}/${probeManifest.runtime.engine}@${probeManifest.runtime.engineVersion ?? "unknown"}` : "AST obligations and blocked seed requirements"}.`
    );
    if (parsed.values.probe) {
        console.warn(
            "The disposable probe contains side effects but cannot undo external I/O. Review semantic validity and replace presets with explicit deterministic samples when needed."
        );
    }
};

try {
    const argumentsValue = process.argv.slice(2);
    const command = argumentsValue[0];
    if (command === "analyze") {
        await analyzeCommand(argumentsValue.slice(1));
    } else if (command === "init") {
        await initCommand(argumentsValue.slice(1));
    } else if (command === "run") {
        await runCommand(argumentsValue.slice(1));
    } else if (command === "report") {
        await reportCommand(argumentsValue.slice(1));
    } else if (command === "--help" || command === "-h") {
        console.log(help);
    } else {
        await runCommand(argumentsValue);
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
