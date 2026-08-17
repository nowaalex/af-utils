import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
    analyzeHotModule,
    formatHotAnalysis
} from "@af-utils/check-hot/analyzer";
import { getProblemDefinition } from "@af-utils/check-hot";

const execute = promisify(execFile);
const directory = import.meta.dirname;
const workspace = dirname(directory);
const generated = resolve(directory, ".generated");
const suiteFile = resolve(generated, "three.math-utils.node.suite.mjs");
const runtimeFile = resolve(generated, "three.math-utils.node.report.json");
const cli = fileURLToPath(new URL("../../core/dist/cli.js", import.meta.url));
const formatter = fileURLToPath(
    new URL("../../../../node_modules/.bin/oxfmt", import.meta.url)
);

const runCli = async argumentsValue => {
    const result = await execute(process.execPath, [cli, ...argumentsValue], {
        cwd: workspace,
        maxBuffer: 16 * 1024 * 1024
    });
    return result.stdout.trim();
};

const packageRootFor = report =>
    resolve(
        report.entry,
        ...report.entryPackagePath.split("/").map(() => "..")
    );

const portablePath = (packageRoot, file) =>
    relative(packageRoot, file).split(sep).join("/");

const countRules = findings => {
    const counts = new Map();
    for (const finding of findings) {
        counts.set(finding.rule, (counts.get(finding.rule) ?? 0) + 1);
    }
    return Object.fromEntries(
        [...counts].toSorted(
            ([leftRule, leftCount], [rightRule, rightCount]) =>
                rightCount - leftCount || leftRule.localeCompare(rightRule)
        )
    );
};

const summarizeCandidate = (candidate, packageRoot, preferredRule) => {
    const findings = [
        ...new Map(
            candidate.findings.map(finding => [finding.rule, finding])
        ).values()
    ]
        .toSorted(
            (left, right) =>
                Number(right.rule === preferredRule) -
                Number(left.rule === preferredRule)
        )
        .slice(0, 3);
    return {
        id: candidate.id,
        path: portablePath(packageRoot, candidate.file),
        line: candidate.line,
        score: candidate.score,
        exported: candidate.exported,
        reasons: candidate.reasons,
        findings: findings.map(finding => {
            const definition = getProblemDefinition(finding.rule);
            return {
                problemId: finding.rule,
                evidence: definition?.evidence ?? "static-hypothesis",
                line: finding.line,
                message: finding.message,
                likelyCause: definition?.likelyCauses[0],
                experiment: definition?.confirmWith[0] ?? finding.suggestion,
                possibleAction: definition?.remediations[0]
            };
        })
    };
};

const prioritizedRuleIds = [
    "parameter-property-access",
    "dynamic-keyed-access-in-loop",
    "numeric-operation",
    "allocation-in-loop",
    "late-instance-property-write",
    "delete-property",
    "shape-or-prototype-mutation",
    "callback-parameter-flow",
    "control-flow-in-loop",
    "heterogeneous-array-literal"
];

const selectDiverseCandidates = candidates => {
    const selected = [];
    const selectedIds = new Set();
    for (const rule of prioritizedRuleIds) {
        const candidate = candidates.find(
            item =>
                !selectedIds.has(item.id) &&
                item.findings.some(finding => finding.rule === rule)
        );
        if (!candidate) continue;
        selected.push({ candidate, preferredRule: rule });
        selectedIds.add(candidate.id);
    }
    for (const candidate of candidates) {
        if (selected.length >= 20) break;
        if (selectedIds.has(candidate.id)) continue;
        selected.push({ candidate });
        selectedIds.add(candidate.id);
    }
    return selected;
};

const unique = values => [...new Set(values)];

const summarizeRuntime = report => {
    const run = report.runs[0];
    if (!run?.worker) throw new Error("Three.js runtime report has no worker");
    const selected = run.coverage.filter(entry => entry.status !== "ignored");
    const preflights = selected.flatMap(entry =>
        entry.preflight ? [entry.preflight] : []
    );
    const exclusions = new Map(
        preflights.flatMap(preflight =>
            (preflight.mutationPlan?.excludedVariants ?? []).map(exclusion => [
                exclusion.variant,
                exclusion.reason
            ])
        )
    );
    const observations = preflights.flatMap(
        preflight => preflight.mutationPlan?.observations ?? []
    );
    return {
        schemaVersion: 1,
        suite: report.suite,
        passed: report.passed,
        coverageComplete: report.coverageComplete,
        runtime: run.worker.runtime,
        tier: run.tier,
        mode: run.mode,
        scenarios: run.scenarios,
        targets: run.worker.targets,
        selectedObligations: selected.length,
        ignoredObligations: run.coverage.length - selected.length,
        selectedStatuses: Object.fromEntries(
            unique(selected.map(entry => entry.status)).map(status => [
                status,
                selected.filter(entry => entry.status === status).length
            ])
        ),
        sampleIds: unique(preflights.map(preflight => preflight.sampleId)),
        acceptedVariants: unique(
            observations
                .filter(
                    observation => observation.variant !== "adapter-baseline"
                )
                .map(observation => observation.variant)
        ),
        representations: unique(
            observations.map(observation => observation.representation)
        ),
        excludedVariants: [...exclusions].map(([variant, reason]) => ({
            variant,
            reason
        })),
        targetDeoptimizations: run.deoptimizations.length,
        problems: run.problems
    };
};

const markdownFor = (analysis, runtime) => {
    const candidates = analysis.topCandidates
        .slice(0, 10)
        .map(
            (candidate, index) =>
                `${index + 1}. \`${candidate.id}\` (${candidate.path}:${candidate.line}, score ${candidate.score})\n` +
                candidate.findings
                    .map(
                        finding =>
                            `   - **${finding.problemId}** (${finding.evidence}): ${finding.message}\n` +
                            `     Likely cause: ${finding.likelyCause ?? "requires measurement"}\n` +
                            `     Confirm: ${finding.experiment}\n` +
                            `     Possible action: ${finding.possibleAction?.action ?? "collect runtime evidence first"} (${finding.possibleAction?.when ?? "only after the hypothesis is confirmed"})`
                    )
                    .join("\n")
        )
        .join("\n");
    const exclusions = runtime.excludedVariants
        .map(item => `- \`${item.variant}\`: ${item.reason}`)
        .join("\n");
    return `# Three.js check-hot report

## Verdict

- Package root: \`three@${analysis.package.version}\`, ${analysis.metrics.files} files, ${analysis.metrics.candidates} function candidates, ${analysis.metrics.findings} static risk hypotheses, ${analysis.metrics.obligations} runtime obligations.
- Root coverage is **incomplete**, not failed Three.js code: ${analysis.graph.diagnostics.length} dynamic/CDN graph boundaries require explicit environments.
- Measured target: \`MathUtils.lerp\` on \`${runtime.runtime.name}@${runtime.runtime.version}/${runtime.runtime.engine}@${runtime.runtime.engineVersion}\`.
- Runtime result: **${runtime.passed && runtime.coverageComplete ? "PASS" : "NOT PROVEN"}**; ${runtime.selectedObligations} selected obligations passed with exact guarded-site evidence, ${runtime.targetDeoptimizations} target deoptimizations.

No change to \`lerp\` is justified by this run: it remained in ${runtime.targets[0]?.activeTier ?? "an unknown tier"}, preserved semantics, and accepted three distinct numeric representations. The report deliberately does not blame helper/verifier deoptimizations on Three.js.

## Measured numeric domain

- Accepted variants: ${runtime.acceptedVariants.map(value => `\`${value}\``).join(", ")}.
- Observed representations: ${runtime.representations.map(value => `\`${value}\``).join(", ")}.
- Semantic sample: ${runtime.sampleIds.map(value => `\`${value}\``).join(", ")}.

Excluded inputs do not count as tested evidence:

${exclusions}

## Prioritized follow-up experiments

These are AST-ranked hypotheses, not confirmed performance defects. Run a representative renderer/loader workload before changing source.

${candidates}

## Root graph boundaries

${analysis.graph.diagnostics.map(diagnostic => `- ${diagnostic}`).join("\n")}

## Interpretation

- Shape/property findings suggest testing stable, reordered, extra, and missing-field objects; they do not imply that polymorphism is harmful by itself.
- Dynamic keyed accesses in loops deserve string/index/key-family scenarios and IC evidence before a rewrite.
- Numeric findings deserve only API-valid SMI/double/-0/boundary variants with an args-aware semantic oracle.
- The package-root scan includes source, distributions, WebGL/WebGPU, and examples. Prefer narrow public modules for runtime proof so unrelated browser/CDN code cannot masquerade as covered.
`;
};

await mkdir(generated, { recursive: true });
await runCli([
    "init",
    "three/src/math/MathUtils.js",
    "--probe",
    "--function",
    "lerp",
    "--probe-runtime",
    "node",
    "--test-runner",
    "@af-utils/check-hot-test-runners/three",
    "--out",
    suiteFile,
    "--force"
]);
await runCli([
    "run",
    suiteFile,
    "--runtime",
    "node",
    "--tier",
    "turbofan",
    "--mode",
    "combined",
    "--repeat",
    "1",
    "--deopts",
    "targets",
    "--json",
    runtimeFile,
    "--color",
    "never"
]);

const runtimeReport = JSON.parse(await readFile(runtimeFile, "utf8"));
if (!runtimeReport.passed || !runtimeReport.coverageComplete) {
    throw new Error(
        "Three.js MathUtils runtime proof did not pass; inspect .generated before accepting advice"
    );
}
const runtimeSummary = summarizeRuntime(runtimeReport);
const report = await analyzeHotModule({ input: "three", runtime: "node" });
const packageRoot = packageRootFor(report);
const rootText = formatHotAnalysis(report, {
    top: 20,
    color: "never",
    codeFrame: true
}).replaceAll(packageRoot, "<three-package>");
const sourceCandidates = report.candidates.filter(candidate =>
    portablePath(packageRoot, candidate.file).startsWith("src/")
);
const analysisSummary = {
    schemaVersion: 1,
    package: {
        name: report.packageName,
        version: report.packageVersion,
        runtime: report.runtime,
        entry: report.entryPackagePath
    },
    metrics: {
        files: report.files,
        candidates: report.candidates.length,
        findings: report.findings.length,
        obligations: report.obligations.length
    },
    graph: {
        complete: report.graphComplete,
        diagnostics: report.diagnostics.map(diagnostic =>
            diagnostic.replaceAll(packageRoot, "<three-package>")
        ),
        externalBoundaries: report.externalBoundaries.length
    },
    ruleCounts: countRules(report.findings),
    topCandidates: selectDiverseCandidates(sourceCandidates).map(
        ({ candidate, preferredRule }) =>
            summarizeCandidate(candidate, packageRoot, preferredRule)
    ),
    limitations: report.limitations
};

const rootTextFile = resolve(directory, "root-analysis.txt");
const analysisSummaryFile = resolve(directory, "root-analysis.summary.json");
const runtimeSummaryFile = resolve(directory, "runtime-summary.json");
const humanReportFile = resolve(directory, "REPORT.md");
await Promise.all([
    writeFile(rootTextFile, `${rootText}\n`),
    writeFile(
        analysisSummaryFile,
        `${JSON.stringify(analysisSummary, null, 2)}\n`
    ),
    writeFile(
        runtimeSummaryFile,
        `${JSON.stringify(runtimeSummary, null, 2)}\n`
    ),
    writeFile(humanReportFile, markdownFor(analysisSummary, runtimeSummary))
]);
await execute(
    formatter,
    [analysisSummaryFile, runtimeSummaryFile, humanReportFile],
    {
        cwd: workspace
    }
);

console.log(
    `Three.js audit refreshed: ${analysisSummary.metrics.findings} hypotheses; ${runtimeSummary.selectedObligations} measured obligations; runtime ${runtimeSummary.passed ? "PASS" : "NOT PROVEN"}.`
);
