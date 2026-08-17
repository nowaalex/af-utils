import { relative } from "node:path";

import picocolors from "picocolors";

import type {
    FormatHotAnalysisOptions,
    HotAnalysisFinding,
    HotAnalysisReport
} from "./model.js";
import { getProblemDefinition } from "../problems/catalog.js";
import { checkModuleGraph } from "../problems/module-graph/check.js";

export const shortPath = (file: string) => {
    const fragment = relative(process.cwd(), file);
    return fragment.startsWith("..") ? file : fragment;
};

const expandFrameTabs = (value: string) => value.replaceAll("\t", "    ");

const frameColumn = (sourceLine: string, column: number) =>
    expandFrameTabs(sourceLine.slice(0, Math.max(0, column - 1))).length;

const formatFindingFrame = (
    finding: HotAnalysisFinding,
    colors: ReturnType<typeof picocolors.createColors>
) => {
    const sourceLines =
        finding.sourceLines.length > 0
            ? finding.sourceLines
            : [finding.sourceLine];
    const visibleIndexes =
        sourceLines.length <= 5
            ? sourceLines.map((_, index) => index)
            : [0, 1, -1, sourceLines.length - 2, sourceLines.length - 1];
    const width = String(finding.endLine).length;
    const lines: string[] = [];
    for (const index of visibleIndexes) {
        if (index === -1) {
            lines.push(`   ${colors.dim(`${"…".padStart(width)} │`)}`);
            continue;
        }
        const sourceLine = sourceLines[index] ?? "";
        const lineNumber = finding.line + index;
        const markerStart =
            index === 0 ? frameColumn(sourceLine, finding.column) : 0;
        const markerEnd =
            index === sourceLines.length - 1
                ? frameColumn(sourceLine, finding.endColumn)
                : expandFrameTabs(sourceLine).length;
        lines.push(
            `   ${colors.dim(`${String(lineNumber).padStart(width)} │`)} ${expandFrameTabs(sourceLine)}`,
            `   ${colors.dim(`${" ".repeat(width)} │`)} ${" ".repeat(markerStart)}${colors.red("^".repeat(Math.max(1, markerEnd - markerStart)))}`
        );
    }
    return lines;
};

/** Format a concise human report while preserving JSON as the detailed format. */
export const formatHotAnalysis = (
    report: HotAnalysisReport,
    options: number | FormatHotAnalysisOptions = {}
) => {
    const normalized = typeof options === "number" ? { top: options } : options;
    const top = normalized.top ?? 20;
    const colorEnabled =
        normalized.color === "always" ||
        (normalized.color !== "never" &&
            Boolean(process.stdout.isTTY) &&
            process.env.NO_COLOR === undefined);
    const colors = picocolors.createColors(colorEnabled);
    const shown = report.candidates.slice(0, top);
    const lines = [
        colors.bold(
            `check-hot analyze: ${
                report.packageName
                    ? `${report.packageName}@${report.packageVersion ?? "unknown"}`
                    : report.input
            }`
        ),
        `entry: ${shortPath(report.entry)} (${report.runtime} export conditions)`,
        `parsed: ${report.files} package file(s), ${report.candidates.length} function(s), ${report.findings.length} risk(s), ${report.obligations.length} obligation(s), ${report.externalBoundaries.length} external edge(s)`,
        "",
        `Top ${shown.length} dynamic-check candidates:`
    ];
    const shownGuidance = new Map<string, HotAnalysisFinding>();
    for (const [index, candidate] of shown.entries()) {
        lines.push(
            `${index + 1}. [${candidate.score}] ${candidate.id} — ${shortPath(candidate.file)}:${candidate.line}`,
            `   ${candidate.reasons.join(", ") || "structural candidate"}`
        );
        for (const finding of candidate.findings.slice(0, 3)) {
            if (!shownGuidance.has(finding.rule)) {
                shownGuidance.set(finding.rule, finding);
            }
            const problem = getProblemDefinition(finding.rule);
            const severity =
                finding.severity === "critical"
                    ? colors.red(finding.severity)
                    : finding.severity === "warning"
                      ? colors.yellow(finding.severity)
                      : colors.cyan(finding.severity);
            lines.push(
                `   ${severity}: ${colors.bold(problem?.title ?? finding.rule)} [${finding.rule}] — ${finding.message}`
            );
            if (normalized.codeFrame) {
                lines.push(...formatFindingFrame(finding, colors));
            }
        }
    }
    if (shownGuidance.size > 0) {
        lines.push("", "Conditional problem guidance:");
        for (const [problemId, finding] of shownGuidance) {
            const definition = getProblemDefinition(problemId);
            lines.push(
                `- ${problemId} [${definition?.evidence ?? "static-hypothesis"}]: ${finding.suggestion}`
            );
            if (definition) {
                lines.push(
                    `  confirm: ${definition.confirmWith[0]}`,
                    `  possible action: ${definition.remediations[0].action} (${definition.remediations[0].when})`
                );
            }
        }
    }
    const graphProblem = checkModuleGraph(
        report.graphComplete,
        report.diagnostics
    );
    if (graphProblem) {
        const definition = getProblemDefinition(graphProblem.problemId);
        lines.push(
            "",
            `Problem: ${definition?.title ?? graphProblem.problemId} [${graphProblem.problemId}] — ${graphProblem.message}`
        );
        if (definition) {
            lines.push(
                `confirm: ${definition.confirmWith[0]}`,
                `possible action: ${definition.remediations[0].action} (${definition.remediations[0].when})`
            );
        }
    }
    if (report.diagnostics.length > 0) {
        lines.push("", "Diagnostics:");
        for (const diagnostic of report.diagnostics)
            lines.push(`- ${diagnostic}`);
    }
    lines.push("", "Boundaries:");
    for (const limitation of report.limitations) lines.push(`- ${limitation}`);
    lines.push(
        "",
        "Next: generate a safe scaffold with `check-hot init <input>` or explicitly probe through an external runner with `--probe --test-runner <module>`."
    );
    return lines.join("\n");
};
