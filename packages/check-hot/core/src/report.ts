import type { HotRunResult, HotRunSummary } from "./types.js";
import picocolors from "picocolors";
import {
    explainV8Deoptimization,
    parseV8Deoptimization
} from "./runtime-oracles/v8-deoptimization/report.js";
import { getProblemDefinition } from "./problems/catalog.js";
import { coverageProblem } from "./problems/coverage-proof/check.js";

const formatRun = (
    run: HotRunResult,
    verbose: boolean,
    colors: ReturnType<typeof picocolors.createColors>
) => {
    const incompleteCoverage = (
        run.coverage ??
        run.worker?.coverage ??
        []
    ).some(
        entry =>
            entry.status === "blocked" ||
            entry.status === "failed" ||
            entry.status === "unsupported"
    );
    const status = run.passed
        ? incompleteCoverage
            ? colors.yellow("JIT PASS / COVERAGE BLOCKED")
            : colors.green("PASS")
        : colors.red("FAIL");
    const runtime = run.worker?.runtime;
    const fingerprint = runtime
        ? `${runtime.name}@${runtime.version}/${runtime.engine}@${runtime.engineVersion ?? "unknown"}${runtime.oracleId ? `/${runtime.oracleId}@${runtime.oracleVersion}` : ""}`
        : run.runtime;
    const scenario =
        run.mode === "combined" && run.scenarios.length > 2
            ? `${run.scenarios.length} scenarios`
            : run.scenarios.join(", ");
    const lines = [
        `${status} ${fingerprint}/${run.tier} ${run.mode} (${scenario}, run ${run.repetition}) ${run.durationMs}ms`
    ];
    if (run.worker?.adapter) {
        lines.push(
            `  adapter: ${run.worker.adapter.id}@${run.worker.adapter.version}, seeds probed on ${run.worker.adapter.probeRuntime}@${run.worker.adapter.probeRuntimeVersion}`
        );
    }
    const emittedGuidance = new Set<string>();

    const appendGuidance = (
        problemId: string,
        indent: string,
        force = false
    ) => {
        const definition = getProblemDefinition(problemId);
        if (
            !definition ||
            emittedGuidance.has(problemId) ||
            (!verbose && !force)
        )
            return;
        emittedGuidance.add(problemId);
        lines.push(`${indent}evidence: ${definition.evidence}`);
        if (definition.likelyCauses[0]) {
            lines.push(`${indent}likely cause: ${definition.likelyCauses[0]}`);
        }
        if (definition.confirmWith[0]) {
            lines.push(`${indent}confirm: ${definition.confirmWith[0]}`);
        }
        if (
            definition.evidence !== "static-hypothesis" &&
            definition.remediations[0]
        ) {
            lines.push(
                `${indent}possible action: ${definition.remediations[0].action} (${definition.remediations[0].when})`
            );
        }
    };

    for (const problem of run.problems) {
        if (problem.problemId === "v8-guarded-deoptimization") continue;
        const definition = getProblemDefinition(problem.problemId);
        lines.push(
            `  problem: ${definition?.title ?? problem.problemId} [${problem.problemId}]${problem.targetId ? ` (${problem.targetId})` : ""} — ${problem.message}`
        );
        if (verbose && problem.detail) lines.push(`    ${problem.detail}`);
        appendGuidance(problem.problemId, "    ", true);
    }
    for (const coverage of run.coverage ?? run.worker?.coverage ?? []) {
        if (coverage.status === "passed" && !verbose) continue;
        if (coverage.status === "ignored" && !verbose) continue;
        const problem = coverageProblem(coverage);
        const definition = problem
            ? getProblemDefinition(problem.problemId)
            : undefined;
        lines.push(
            `  coverage ${coverage.status}${problem ? ` [${problem.problemId}: ${definition?.title ?? problem.problemId}]` : ""}: ${coverage.obligationId}${coverage.evidence ? ` (${coverage.evidence.rule} at ${coverage.evidence.span.file}:${coverage.evidence.span.line}:${coverage.evidence.span.column})` : ""} — ${coverage.reason}`
        );
        if (verbose) {
            if (coverage.preflight) {
                lines.push(
                    `    selected semantic sample: ${coverage.preflight.sampleId}`
                );
            }
            for (const exclusion of coverage.preflight?.mutationPlan
                ?.excludedVariants ?? []) {
                lines.push(
                    `    excluded ${exclusion.variant}: ${exclusion.reason}`
                );
            }
        }
        if (problem) appendGuidance(problem.problemId, "    ", true);
    }
    const emittedHints = new Set<string>();
    for (const line of run.deoptimizations) {
        const detail = parseV8Deoptimization(line);
        const matchingTargets =
            run.worker?.targets.filter(
                candidate => candidate.functionName === detail.functionName
            ) ?? [];
        const target =
            matchingTargets.length === 1 ? matchingTargets[0] : undefined;
        const label = target
            ? `${target.id}${
                  target.functionName === target.id
                      ? ""
                      : ` [runtime: ${target.functionName || "anonymous"}]`
              }`
            : matchingTargets.length > 1
              ? `${detail.functionName} [ambiguous runtime-name match]`
              : detail.functionName;
        lines.push(
            `  deopt: ${label}: ${detail.reason}${target ? " [runtime-name match; exact source correlation unavailable]" : " [exact source correlation unavailable]"}`
        );
        const hint = explainV8Deoptimization(detail.reason);
        if (!emittedHints.has(hint)) {
            emittedHints.add(hint);
            lines.push(`    hint: ${hint}`);
        }
        appendGuidance("v8-guarded-deoptimization", "    ", true);
        if (verbose) lines.push(`    ${line.trim()}`);
    }
    if (!run.passed) {
        lines.push(
            `  reproduce: ${run.command.map(argument => JSON.stringify(argument)).join(" ")}`
        );
    }
    if (verbose && run.worker) {
        for (const target of run.worker.targets) {
            const detail =
                target.engine === "jsc"
                    ? `DFG compiled historically=${target.compiledHistorically}, current tier=${target.currentTier}, compiles=${target.dfgCompiles}, retries=${target.reoptimizationRetries}`
                    : `V8 requested=${target.requestedTier}, active=${target.activeTier}, status=${target.status}`;
            lines.push(
                `  target: ${target.id} (${target.functionName || "anonymous"}) ${detail}`
            );
        }
    }
    const v8 = run.diagnostics?.v8IcMaps;
    if (v8) {
        lines.push(
            `  advisory V8 IC/Map: ${v8.graph.inlineCaches.length} scoped IC transition(s), ${v8.graph.maps.length} Map node(s), ${v8.graph.transitions.length} edge(s); targets matched=${v8.targetScope.matchedTargetIds.length}/${v8.targetScope.requestedTargetIds.length}${v8.gap ? `; gap=${v8.gap}` : ""}`
        );
        if (verbose) {
            for (const transition of v8.graph.inlineCaches.slice(0, 20)) {
                lines.push(
                    `    IC ${transition.operation} ${transition.from} -> ${transition.to}${transition.key ? ` key=${transition.key}` : ""} [${transition.correlation}]`
                );
            }
            for (const edge of v8.graph.transitions.slice(0, 20)) {
                lines.push(
                    `    Map ${edge.from} -> ${edge.to}${edge.property ? ` property=${edge.property}` : ""} [engine logged; connected to a target-observed Map; correlation unavailable]`
                );
            }
        }
    }
    const cpu = run.diagnostics?.cpuProfile;
    if (cpu) {
        const authenticatedCandidateSamples = cpu.functions.reduce(
            (total, entry) =>
                total + (entry.candidateId === undefined ? 0 : entry.samples),
            0
        );
        const authenticatedCandidateShare =
            cpu.totalSamples === 0
                ? 0
                : authenticatedCandidateSamples / cpu.totalSamples;
        lines.push(
            `  advisory CPU whole-process ranking: ${cpu.totalSamples} attributable sample(s), ${cpu.unattributedSamples} unattributed; authenticated analyzer candidates=${authenticatedCandidateSamples} sample(s) (${(authenticatedCandidateShare * 100).toFixed(2)}% of the diagnostic process); ${cpu.unobservedCandidateIds.length} authenticated candidate(s) unobserved${cpu.gap ? `; gap=${cpu.gap}` : ""}`
        );
        if (verbose) {
            for (const entry of cpu.functions.slice(0, 20)) {
                lines.push(
                    `    ${entry.functionName}: ${entry.samples} (${(entry.sampleShare * 100).toFixed(2)}% of whole diagnostic process) [${entry.correlation}]${entry.candidateId ? ` candidate=${entry.candidateId}` : ""}`
                );
            }
        }
    }
    const jsc = run.diagnostics?.jscSampling;
    if (jsc) {
        const tierText = Object.entries(jsc.tiers)
            .map(
                ([tier, value]) =>
                    `${tier}=${value.samples} (${value.percent}%)`
            )
            .join(", ");
        lines.push(
            `  advisory JSC sampling: ${jsc.gap ?? `${jsc.totalSamples} sample(s); ${tierText}`}`
        );
        if (verbose && jsc.functions) {
            lines.push(
                ...jsc.functions
                    .split(/\r?\n/u)
                    .slice(0, 12)
                    .map(line => `    ${line}`)
            );
        }
        if (verbose && jsc.stackTraces.length > 0) {
            lines.push(
                `    stack traces: showing ${Math.min(5, jsc.stackTraces.length)} of ${jsc.stackTraceCount}${jsc.stackTracesTruncated ? " (bounded)" : ""}`,
                ...jsc.stackTraces
                    .slice(0, 5)
                    .map(
                        (trace, index) =>
                            `    #${index + 1} ${trace.replaceAll(/\s+/gu, " ").trim()}`
                    )
            );
        }
    }
    for (const problem of run.diagnostics?.problems ?? []) {
        const definition = getProblemDefinition(problem.problemId);
        lines.push(
            `  advisory problem: ${definition?.title ?? problem.problemId} [${problem.problemId}] — ${problem.message}`
        );
        appendGuidance(problem.problemId, "    ", true);
    }
    if (verbose && run.events.length > 0) {
        lines.push(
            "  event streams (separate processes are not chronologically merged):"
        );
        let previousStream: string | undefined;
        for (const event of run.events) {
            if (event.streamId !== previousStream) {
                previousStream = event.streamId;
                lines.push(`    stream ${event.streamId} (${event.purpose})`);
            }
            lines.push(
                `      #${event.sequence} ${event.phase}/${event.kind} [${event.correlation}]: ${event.message}`
            );
        }
    }
    return lines;
};

/** Format a concise human-readable CI report with actionable deopt reasons. */
export const formatHotRunSummary = (
    summary: HotRunSummary,
    options: {
        verbose?: boolean;
        color?: "auto" | "always" | "never";
    } = {}
) => {
    const colors = picocolors.createColors(
        options.color === "always" ||
            (options.color !== "never" &&
                Boolean(process.stdout.isTTY) &&
                process.env.NO_COLOR === undefined)
    );
    const lines = [`check-hot: ${summary.suite}`];
    const summaryProblems = options.verbose
        ? summary.problems
        : summary.problems.slice(0, 20);
    const summaryGuidance = new Set<string>();
    for (const problem of summaryProblems) {
        const definition = getProblemDefinition(problem.problemId);
        lines.push(
            `PROBLEM [${problem.problemId}: ${definition?.title ?? problem.problemId}]${problem.targetId ? ` (${problem.targetId})` : ""}: ${problem.message}`
        );
        if (options.verbose && problem.detail)
            lines.push(`  ${problem.detail}`);
        if (definition && !summaryGuidance.has(problem.problemId)) {
            summaryGuidance.add(problem.problemId);
            lines.push(`  confirm: ${definition.confirmWith[0]}`);
            if (definition.evidence !== "static-hypothesis") {
                lines.push(
                    `  possible action: ${definition.remediations[0].action} (${definition.remediations[0].when})`
                );
            }
        }
    }
    if (summaryProblems.length < summary.problems.length) {
        lines.push(
            `PROBLEMS: ${summary.problems.length - summaryProblems.length} additional occurrence(s); use --verbose or --json for every entry`
        );
    }
    for (const run of summary.runs) {
        lines.push(...formatRun(run, options.verbose ?? false, colors));
    }
    const runtimePassed = summary.runs.filter(run => run.passed).length;
    lines.push(
        summary.passed
            ? `PASS: ${runtimePassed}/${summary.runs.length} runtime runs passed; obligation coverage complete`
            : `FAIL: runtime oracles ${runtimePassed}/${summary.runs.length} passed; obligation coverage ${summary.coverageComplete ? "complete" : "incomplete"}`
    );
    return lines.join("\n");
};
