import type { HotCheckObligation } from "../types.js";
import { mutationFamilyByRule, runtimeExperimentRules } from "./evidence.js";
import type { GenerateHotSuiteOptions, HotAnalysisReport } from "./model.js";
import { shortPath } from "./report.js";

/** Generate a suite scaffold from direct public function exports. */
export const generateHotSuiteSource = (
    report: HotAnalysisReport,
    options: GenerateHotSuiteOptions
) => {
    if (
        Boolean(options.testRunnerSpecifier) !== Boolean(options.probeManifest)
    ) {
        throw new Error(
            "testRunnerSpecifier and probeManifest must be provided together"
        );
    }
    if (options.functions && !options.probeManifest) {
        throw new Error(
            "functions can exclude obligations only together with a versioned probe manifest"
        );
    }
    if (
        options.functions &&
        (options.functions.length === 0 ||
            new Set(options.functions).size !== options.functions.length ||
            options.functions.some(name => name.length === 0))
    ) {
        throw new Error(
            "functions must contain unique non-empty public export names"
        );
    }
    if (
        options.probeManifest &&
        options.probeManifest.runtime.name !== report.runtime
    ) {
        throw new Error(
            `Probe runtime ${options.probeManifest.runtime.name} does not match analyzed runtime ${report.runtime}`
        );
    }
    const top =
        options.top ?? (options.probeManifest ? Number.POSITIVE_INFINITY : 50);
    const directExports = [
        ...new Set(
            report.candidates
                .filter(candidate => candidate.targetId)
                .map(candidate => candidate.targetId as string)
        )
    ].slice(0, top);
    const probedSamples = options.probeManifest?.samples ?? {};
    const probedNames = Object.keys(probedSamples);
    const rankedProbedNames = [
        ...new Set([
            ...report.candidates.map(
                candidate => candidate.targetId ?? candidate.name
            ),
            ...probedNames.toSorted()
        ])
    ].filter(name => probedNames.includes(name));
    const runnableNames = rankedProbedNames.slice(0, top);
    const selectedSamples = Object.fromEntries(
        runnableNames.flatMap(name =>
            probedSamples[name] ? [[name, probedSamples[name]]] : []
        )
    );
    const selectedSampleKeys = new Set(
        Object.entries(selectedSamples).flatMap(([name, labels]) =>
            labels.map(label => `${name}\u0000${label}`)
        )
    );
    const runnableNameSet = new Set(runnableNames);
    const selectedProbeManifest = options.probeManifest
        ? {
              ...options.probeManifest,
              samples: selectedSamples,
              targets: Object.fromEntries(
                  Object.entries(options.probeManifest.targets).filter(
                      ([name]) => runnableNameSet.has(name)
                  )
              ),
              coverage: Object.fromEntries(
                  Object.entries(options.probeManifest.coverage).flatMap(
                      ([name, labels]) => {
                          const selectedLabels = Object.fromEntries(
                              Object.entries(labels).filter(([label]) =>
                                  selectedSampleKeys.has(
                                      `${name}\u0000${label}`
                                  )
                              )
                          );
                          return Object.keys(selectedLabels).length > 0
                              ? [[name, selectedLabels]]
                              : [];
                      }
                  )
              ),
              attempts: options.probeManifest.attempts.filter(
                  attempt =>
                      runnableNameSet.has(attempt.functionName) &&
                      (attempt.status !== "accepted" ||
                          selectedSampleKeys.has(
                              `${attempt.functionName}\u0000${attempt.label}`
                          ))
              )
          }
        : undefined;
    const manualCandidates = report.candidates
        .filter(candidate => !candidate.targetId)
        .slice(0, 15)
        .map(
            candidate =>
                `// - ${candidate.id} (${shortPath(candidate.file)}:${candidate.line})`
        );
    const sampleLines = options.probeManifest
        ? [`    testRunner: loadTestRunner,`, "    probeManifest,"]
        : [
              "    // Add deterministic samples before running. Example:",
              "    // samples: {",
              '    //     exportName: [{ label: "stable-input", args: () => [/* fresh args */] }]',
              "    // },"
          ];
    const includeNames = options.probeManifest ? runnableNames : directExports;
    const workerLoader =
        report.sourceLoader === "tsx" ||
        /\.(?:[cm]?ts|tsx|jsx)(?:$|[?#])/u.test(
            options.testRunnerSpecifier ?? ""
        )
            ? "tsx"
            : undefined;
    const includedNameSet = new Set(includeNames);
    const selectedFunctions = options.functions;
    const explicitlySelectedTargetIds = selectedFunctions
        ? new Set([
              ...selectedFunctions,
              ...report.candidates.flatMap(candidate =>
                  candidate.targetId &&
                  (selectedFunctions.includes(candidate.name) ||
                      (candidate.exportName
                          ? selectedFunctions.includes(candidate.exportName)
                          : false))
                      ? [candidate.targetId]
                      : []
              )
          ])
        : undefined;
    const reconciledObligations = options.probeManifest
        ? runnableNames.flatMap(exportName => {
              const targetIdentity = options.probeManifest?.targets[exportName];
              if (!targetIdentity) return [];
              const matches = report.candidates.filter(
                  candidate =>
                      candidate.runtimeSourceSha256 ===
                      targetIdentity.sourceSha256
              );
              if (matches.length !== 1 || matches[0].targetId) return [];
              const candidate = matches[0];
              return candidate.findings.flatMap(finding => {
                  if (
                      finding.parameterIndex === undefined ||
                      !runtimeExperimentRules.has(finding.rule)
                  ) {
                      return [];
                  }
                  const evidence = report.evidence.find(
                      item =>
                          item.candidateId === candidate.id &&
                          item.rule === finding.rule &&
                          item.span.start === finding.start &&
                          item.span.end === finding.end
                  );
                  const mutationFamily = mutationFamilyByRule[finding.rule];
                  return evidence && mutationFamily
                      ? [
                            {
                                id: `obligation:${evidence.id}`,
                                evidenceId: evidence.id,
                                candidateId: candidate.id,
                                mutationFamily,
                                exportName,
                                parameterIndex: finding.parameterIndex,
                                parameterPath: finding.parameterPath
                            } satisfies HotCheckObligation
                        ]
                      : [];
              });
          })
        : [];
    const generatedObligations = [
        ...report.obligations.map(obligation => {
            if (!obligation.exportName) return obligation;
            if (
                explicitlySelectedTargetIds &&
                !explicitlySelectedTargetIds.has(obligation.exportName)
            ) {
                return {
                    ...obligation,
                    blockedReason: `Excluded by user --function=${options.functions?.join(",")}`
                };
            }
            const excludedByTop = options.probeManifest
                ? probedNames.includes(obligation.exportName) &&
                  !includedNameSet.has(obligation.exportName)
                : !includedNameSet.has(obligation.exportName);
            return excludedByTop
                ? {
                      ...obligation,
                      blockedReason: `Excluded by user --top=${top}`
                  }
                : obligation;
        }),
        ...reconciledObligations
    ];
    const generatedEvidenceIds = new Set(
        generatedObligations.map(obligation => obligation.evidenceId)
    );
    const generatedEvidence = report.evidence.filter(evidence =>
        generatedEvidenceIds.has(evidence.id)
    );
    const selectedPublicTargets = [
        ...new Map(
            report.candidates
                .filter(
                    candidate =>
                        candidate.targetId &&
                        includedNameSet.has(candidate.targetId)
                )
                .flatMap(candidate =>
                    candidate.publicTargets.map(
                        target =>
                            [
                                `${target.modulePath}\u0000${target.exportPath.join("\u0000")}`,
                                target
                            ] as const
                    )
                )
        ).values()
    ];
    const selectedModulePaths = new Set([
        ...(selectedPublicTargets.length === 0 ||
        runnableNames.some(name => !name.includes("::"))
            ? ["."]
            : []),
        ...selectedPublicTargets.map(target => target.modulePath)
    ]);
    const declaredModuleSpecifiers = options.moduleSpecifiers ?? [
        { modulePath: ".", importSpecifier: options.importSpecifier }
    ];
    const selectedModuleSpecifiers = declaredModuleSpecifiers.filter(entry =>
        selectedModulePaths.has(entry.modulePath)
    );
    for (const modulePath of selectedModulePaths) {
        if (
            !selectedModuleSpecifiers.some(
                entry => entry.modulePath === modulePath
            )
        ) {
            throw new Error(
                `No runtime import specifier was provided for public module ${modulePath}`
            );
        }
    }
    const includeLines =
        includeNames.length > 0
            ? [
                  `    include: ${JSON.stringify(includeNames, null, 4)
                      .split("\n")
                      .join("\n    ")},`
              ]
            : [
                  "    // No direct static exports were identified (common for CJS barrels).",
                  "    // Runtime discovery will consider every function export."
              ];
    return [
        'import { createModuleSuite, loadHotTestRunner } from "@af-utils/check-hot";',
        ...(selectedProbeManifest
            ? [
                  `const probeManifest = ${JSON.stringify(selectedProbeManifest, null, 4)};`
              ]
            : []),
        ...(options.testRunnerSpecifier
            ? [
                  `const testRunnerSpecifier = ${JSON.stringify(options.testRunnerSpecifier)};`,
                  "const loadTestRunner = () => loadHotTestRunner(import.meta.resolve(testRunnerSpecifier), probeManifest.runnerSourceSha256, probeManifest.runnerPackageTree, probeManifest.runnerEntryPackagePath, probeManifest.runnerSourceGraph);"
              ]
            : []),
        "",
        `const moduleSpecifiers = ${JSON.stringify(selectedModuleSpecifiers, null, 4)};`,
        "const modules = moduleSpecifiers.map(entry => ({",
        "    modulePath: entry.modulePath,",
        "    resolve: () => import.meta.resolve(entry.importSpecifier),",
        "    load: resolvedUrl => import(resolvedUrl ?? import.meta.resolve(entry.importSpecifier))",
        "}));",
        "",
        "// Generated from static Oxc analysis. Static ranking does not execute the module.",
        ...(options.probeManifest
            ? [
                  `// Recipes were selected in a disposable ${options.probeManifest.runtime.name} process; review semantic validity and replace them with explicit samples when needed.`
              ]
            : []),
        ...(manualCandidates.length > 0
            ? [
                  "// High-ranked methods/non-direct exports needing a custom thin adapter:",
                  ...manualCandidates
              ]
            : []),
        "",
        "export default createModuleSuite({",
        `    name: ${JSON.stringify(report.packageName ?? report.input)},`,
        `    analysis: ${JSON.stringify(
            {
                runtime: report.runtime,
                entrySourceSha256: report.entrySourceSha256,
                entryPackagePath: report.entryPackagePath,
                publicEntries: report.publicEntries,
                sourceGraph: report.sourceGraph,
                packageTree: report.packageTree,
                graphComplete: report.graphComplete,
                diagnostics: report.diagnostics,
                externalBoundaries: report.externalBoundaries,
                sourceLoader: report.sourceLoader
            },
            null,
            4
        )
            .split("\n")
            .join("\n    ")},`,
        ...(workerLoader
            ? [`    workerLoader: ${JSON.stringify(workerLoader)},`]
            : []),
        '    environment: { NODE_ENV: "production" },',
        `    package: ${JSON.stringify(
            {
                name: report.packageName,
                version: report.packageVersion
            },
            null,
            4
        )
            .split("\n")
            .join("\n    ")},`,
        `    evidence: ${JSON.stringify(generatedEvidence, null, 4)
            .split("\n")
            .join("\n    ")},`,
        `    obligations: ${JSON.stringify(generatedObligations, null, 4)
            .split("\n")
            .join("\n    ")},`,
        "    modules,",
        `    publicTargets: ${JSON.stringify(selectedPublicTargets, null, 4)
            .split("\n")
            .join("\n    ")},`,
        ...includeLines,
        ...sampleLines,
        "    options: {",
        options.probeManifest
            ? `        runtimes: [${JSON.stringify(options.probeManifest.runtime.name)}],`
            : `        runtimes: [${JSON.stringify(report.runtime)}],`,
        '        v8Tiers: ["maglev", "turbofan"],',
        '        modes: ["combined", "isolated"],',
        "        repetitions: 2",
        "    }",
        "});",
        ""
    ].join("\n");
};
