import { createHash } from "node:crypto";
import { relative, sep } from "node:path";

import type { HotAstEvidence, HotCheckObligation } from "../types.js";
import type { HotAnalysisCandidate } from "./model.js";
import {
    mutationFamilyByRule,
    runtimeExperimentRules
} from "./rules/catalog.js";

export { mutationFamilyByRule, runtimeExperimentRules };

export const buildEvidencePlan = (
    candidates: readonly HotAnalysisCandidate[],
    packageRoot: string,
    sourceByFile: ReadonlyMap<string, string>
): {
    evidence: readonly HotAstEvidence[];
    obligations: readonly HotCheckObligation[];
} => {
    const evidence: HotAstEvidence[] = [];
    const obligations: HotCheckObligation[] = [];
    for (const candidate of candidates) {
        for (const finding of candidate.findings) {
            const mutationFamily = mutationFamilyByRule[finding.rule];
            if (!mutationFamily) {
                throw new Error(
                    `Analyzer rule ${finding.rule} has no mutation-family obligation mapping`
                );
            }
            const evidenceId = `${candidate.id}::${finding.rule}@${finding.start}:${finding.end}`;
            evidence.push({
                id: evidenceId,
                rule: finding.rule,
                candidateId: candidate.id,
                confidence:
                    finding.parameterIndex === undefined
                        ? "syntactic"
                        : "dataflow-proven",
                subject: finding.message,
                ...(runtimeExperimentRules.has(finding.rule) &&
                finding.parameterIndex !== undefined
                    ? {
                          automation: {
                              version: 1 as const,
                              mutationFamily,
                              parameterIndex: finding.parameterIndex,
                              parameterPath: finding.parameterPath ?? []
                          }
                      }
                    : {}),
                span: {
                    file: finding.file,
                    relativeFile: relative(packageRoot, finding.file)
                        .split(sep)
                        .join("/"),
                    sourceSha256: createHash("sha256")
                        .update(sourceByFile.get(finding.file) ?? "")
                        .digest("hex"),
                    start: finding.start,
                    end: finding.end,
                    line: finding.line,
                    column: finding.column,
                    endLine: finding.endLine,
                    endColumn: finding.endColumn
                },
                ownerSpan: {
                    file: candidate.file,
                    relativeFile: relative(packageRoot, candidate.file)
                        .split(sep)
                        .join("/"),
                    sourceSha256: createHash("sha256")
                        .update(sourceByFile.get(candidate.file) ?? "")
                        .digest("hex"),
                    start: candidate.start,
                    end: candidate.end,
                    line: candidate.line,
                    column: candidate.column,
                    endLine: candidate.endLine,
                    endColumn: candidate.endColumn
                },
                ...(candidate.runtimeLocations
                    ? { runtimeLocations: candidate.runtimeLocations }
                    : {})
            });
            if (
                !runtimeExperimentRules.has(finding.rule) ||
                finding.parameterIndex === undefined ||
                !candidate.exported
            ) {
                continue;
            }
            obligations.push({
                id: `obligation:${evidenceId}`,
                evidenceId,
                candidateId: candidate.id,
                mutationFamily,
                ...(candidate.targetId && candidate.publicTargets[0]
                    ? {
                          exportName: candidate.targetId,
                          publicTarget: candidate.publicTargets[0]
                      }
                    : {
                          blockedReason: `Public callable is reachable only through ${candidate.publicPaths.join(", ")}; analyze that concrete package subpath or provide an exact adapter target`
                      }),
                parameterIndex: finding.parameterIndex,
                parameterPath: finding.parameterPath
            });
        }
    }
    return { evidence, obligations };
};
