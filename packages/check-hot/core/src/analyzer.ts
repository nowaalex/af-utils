import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { HotRuntimeName } from "./types.js";
import { createHotPackageTreeIdentity } from "./source-identity.js";

import type {
    AnalyzeHotModuleOptions,
    HotAnalysisReport
} from "./analyzer/model.js";
import { lineStartsFor } from "./analyzer/ast.js";
import type { AstNode } from "./analyzer/ast.js";
import { buildEvidencePlan } from "./analyzer/evidence.js";
import { parseHotModuleGraph } from "./analyzer/graph/index.js";
import {
    discoverAnalysisEntries,
    findPackageInfo,
    pathExists,
    resolveInput,
    resolveSourceRequest
} from "./analyzer/resolution.js";
import { analyzeCandidate, severityWeight } from "./analyzer/rules/index.js";
import { collectDeclaredNames } from "./analyzer/rules/dataflow.js";
import { assertIgnoredFilesCannotChangeResolution } from "./analyzer/source-integrity/output-safety.js";
import {
    collectCandidateNodes,
    collectPublicExportOrigins
} from "./analyzer/provenance.js";

export type {
    AnalyzeHotModuleOptions,
    FormatHotAnalysisOptions,
    GenerateHotSuiteOptions,
    HotAnalysisCandidate,
    HotAnalysisFinding,
    HotAnalysisMetrics,
    HotAnalysisReport,
    HotAnalysisSeverity
} from "./analyzer/model.js";
export type { HotExternalModuleBoundary } from "./types.js";

/** Parse and rank a local module graph without importing or executing it. */
export const analyzeHotModule = async (
    options: AnalyzeHotModuleOptions
): Promise<HotAnalysisReport> => {
    const maxFiles = options.maxFiles ?? 5_000;
    if (!Number.isInteger(maxFiles) || maxFiles < 1) {
        throw new Error("maxFiles must be a positive integer");
    }
    const runtime = options.runtime ?? "node";
    const entry = await resolveInput(options.input, runtime);
    const packageInfo = await findPackageInfo(entry);
    const packageTree = await createHotPackageTreeIdentity(
        packageInfo.root,
        options.ignorePackageFiles
    );
    const diagnostics: string[] = [];
    const analysisEntries = await discoverAnalysisEntries(
        options.input,
        entry,
        packageInfo,
        runtime,
        diagnostics
    );
    const { parsedFiles, terminalFiles, externalBoundaries } =
        await parseHotModuleGraph({
            entries: analysisEntries.map(analysisEntry => analysisEntry.file),
            packageRoot: packageInfo.root,
            maxFiles,
            diagnostics,
            runtime
        });
    if (externalBoundaries.length > 0) {
        diagnostics.push(
            `${externalBoundaries.length} resolved runtime edge(s) leave the selected package and are not transitively source-authenticated`
        );
    }
    assertIgnoredFilesCannotChangeResolution(
        entry,
        packageInfo,
        parsedFiles,
        options.ignorePackageFiles ?? [],
        runtime
    );
    const publicOrigins = collectPublicExportOrigins(
        analysisEntries,
        parsedFiles
    );
    const candidates = parsedFiles
        .flatMap(parsed => {
            const lineStarts = lineStartsFor(parsed.source);
            const fileDeclaredNames = collectDeclaredNames(
                parsed.program as unknown as AstNode
            );
            const initializedPropertiesByClass = new Map<
                AstNode,
                ReadonlySet<string>
            >();
            return collectCandidateNodes(
                parsed,
                publicOrigins.get(parsed.file) ?? []
            ).map(candidate =>
                analyzeCandidate(
                    candidate,
                    parsed,
                    lineStarts,
                    packageInfo.root,
                    fileDeclaredNames,
                    initializedPropertiesByClass
                )
            );
        })
        .toSorted(
            (left, right) =>
                Number(Boolean(right.annotation)) -
                    Number(Boolean(left.annotation)) ||
                Number(right.exported) - Number(left.exported) ||
                right.score - left.score ||
                left.file.localeCompare(right.file) ||
                left.line - right.line
        );
    const findings = candidates
        .flatMap(candidate => candidate.findings)
        .toSorted(
            (left, right) =>
                severityWeight[right.severity] -
                    severityWeight[left.severity] ||
                left.file.localeCompare(right.file) ||
                left.line - right.line
        );
    const evidencePlan = buildEvidencePlan(
        candidates,
        packageInfo.root,
        new Map(parsedFiles.map(parsed => [parsed.file, parsed.source]))
    );
    const entrySource = parsedFiles.find(
        parsed => parsed.file === entry
    )?.source;
    if (entrySource === undefined) {
        throw new Error(`Analyzer did not parse its selected entry ${entry}`);
    }
    const parsedSourceByFile = new Map(
        parsedFiles.map(parsed => [parsed.file, parsed.source])
    );
    const publicEntries = analysisEntries.map(analysisEntry => {
        const source = parsedSourceByFile.get(analysisEntry.file);
        if (source === undefined) {
            throw new Error(
                `Analyzer did not parse public entry ${analysisEntry.publicPath} at ${analysisEntry.file}`
            );
        }
        return {
            modulePath: analysisEntry.publicPath,
            entryPackagePath: relative(packageInfo.root, analysisEntry.file)
                .split(sep)
                .join("/"),
            entrySourceSha256: createHash("sha256").update(source).digest("hex")
        };
    });
    const terminalSourceGraph = await Promise.all(
        terminalFiles.map(async file => ({
            relativeFile: relative(packageInfo.root, file).split(sep).join("/"),
            sourceSha256: createHash("sha256")
                .update(await readFile(file))
                .digest("hex")
        }))
    );
    const publicOriginBoundary =
        candidates.length > 0 &&
        !candidates.some(candidate => candidate.exported)
            ? [
                  "Static public-origin linkage found no function export. Factory/UMD/CommonJS surfaces require an isolated runtime probe before internal candidates can be reconciled with public callables."
              ]
            : [];
    return {
        input: options.input,
        entry,
        entrySourceSha256: createHash("sha256")
            .update(entrySource)
            .digest("hex"),
        entryPackagePath: relative(packageInfo.root, entry)
            .split(sep)
            .join("/"),
        publicEntries,
        sourceGraph: [
            ...parsedFiles.map(parsed => ({
                relativeFile: relative(packageInfo.root, parsed.file)
                    .split(sep)
                    .join("/"),
                sourceSha256: createHash("sha256")
                    .update(parsed.source)
                    .digest("hex")
            })),
            ...terminalSourceGraph
        ].toSorted((left, right) =>
            left.relativeFile < right.relativeFile
                ? -1
                : left.relativeFile > right.relativeFile
                  ? 1
                  : 0
        ),
        packageTree,
        runtime,
        packageName: packageInfo.name,
        packageVersion: packageInfo.version,
        files: parsedFiles.length,
        diagnostics,
        externalBoundaries,
        graphComplete:
            diagnostics.length === 0 && externalBoundaries.length === 0,
        sourceLoader: parsedFiles.some(parsed =>
            [".ts", ".mts", ".cts", ".tsx", ".jsx"].includes(
                extname(parsed.file)
            )
        )
            ? "tsx"
            : undefined,
        candidates,
        findings,
        evidence: evidencePlan.evidence,
        obligations: evidencePlan.obligations,
        limitations: [
            ...publicOriginBoundary,
            ...(externalBoundaries.length > 0
                ? [
                      `${externalBoundaries.length} resolved runtime edge(s) leave the selected package. Their code is executed by scenarios but is not claimed as statically analyzed or source-authenticated by this report.`
                  ]
                : []),
            "Static findings are risk indicators, not proof of a V8 or JavaScriptCore deoptimization.",
            "Data-dependent shapes, value representations, callback identities, and production lifecycle order require dynamic scenarios.",
            "Static imports and re-exports are resolved through package exports/imports, TypeScript paths, and extension aliases; dynamic specifiers still need runtime evidence.",
            "Minified or generated distributions reduce source-level recommendation quality; analyze source and execute production builds when possible."
        ]
    };
};

export { formatHotAnalysis } from "./analyzer/report.js";

export {
    mergeHotModuleProbeManifests,
    probeHotModule
} from "./analyzer/probe.js";
export type { ProbeHotModuleOptions } from "./analyzer/probe.js";

export { generateHotSuiteSource } from "./analyzer/generator.js";

/** Convert a resolved entry to a portable relative ESM specifier. */
export const relativeImportSpecifier = (entry: string, outputFile: string) => {
    let fragment = relative(dirname(resolve(outputFile)), entry)
        .split(sep)
        .join("/");
    if (!fragment.startsWith(".")) fragment = `./${fragment}`;
    return fragment;
};

/** Resolve a user input to its analyzer entry without executing the module. */
export const resolveHotAnalysisInput = resolveInput;

/** Resolve an external test-runner from the caller's working directory. */
export const resolveHotTestRunner = async (
    specifier: string,
    runtime: HotRuntimeName = "node"
) => {
    if (specifier.startsWith("file:")) return specifier;
    const request = (await pathExists(resolve(specifier)))
        ? resolve(specifier)
        : specifier;
    const result = await resolveSourceRequest(
        resolve(process.cwd(), "check-hot.test-runner.mjs"),
        request,
        runtime
    );
    if (!result.path) {
        throw new Error(
            `Unable to resolve test runner ${specifier} from ${process.cwd()} through package exports: ${result.error ?? "no supported JS/TS source"}`
        );
    }
    return pathToFileURL(result.path).href;
};

/** Convert a file URL accepted by APIs into a local analyzer input. */
export const hotAnalysisPathFromUrl = (url: URL) => fileURLToPath(url);
