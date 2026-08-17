import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import {
    discoverHotAnnotations,
    hotAnnotationTargetAlias
} from "@af-utils/check-hot/annotations";
import { analyzeHotModule } from "@af-utils/check-hot/analyzer";

const packageRoot = resolve(import.meta.dirname, "../..");
const generatedTargetFile = resolve(packageRoot, ".jit/annotated-targets.mjs");
const annotationRoots = [
    resolve(packageRoot, "src/models"),
    resolve(packageRoot, "src/platform"),
    resolve(packageRoot, "src/benchmarks/privateFieldFixture.ts")
];
const annotations = (await discoverHotAnnotations(annotationRoots)).toSorted(
    (left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
);
const aliases = new Set();
const targetRows = annotations.map(annotation => {
    if (!annotation.owner || annotation.owner !== annotation.id) {
        throw new Error(
            `check-hot marker ${annotation.id} must be attached to its exact prototype owner, received ${annotation.owner ?? "none"}`
        );
    }
    const separator = annotation.owner.lastIndexOf(".");
    const owner = annotation.owner.slice(0, separator);
    const method = annotation.owner.slice(separator + 1);
    if (
        !/^[A-Za-z_$][\w$]*$/u.test(owner) ||
        !/^[A-Za-z_$][\w$]*$/u.test(method)
    ) {
        throw new Error(
            `Generated prototype target ${annotation.id} must use identifier owner and method names`
        );
    }
    const alias = hotAnnotationTargetAlias(annotation.id);
    if (aliases.has(alias)) {
        throw new Error(`Generated hot-target alias ${alias} is not unique`);
    }
    aliases.add(alias);
    return `    ${alias}: defineHotTarget(${JSON.stringify(annotation.id)}, state => Object.getPrototypeOf(state.hotTargetOwners[${JSON.stringify(owner)}]).${method})`;
});

await mkdir(resolve(packageRoot, ".jit"), { recursive: true });
await writeFile(
    generatedTargetFile,
    [
        'import { defineHotTarget } from "@af-utils/check-hot";',
        "",
        "export const annotatedHotTargets = Object.freeze({",
        targetRows.join(",\n"),
        "});",
        ""
    ].join("\n")
);

await build({
    absWorkingDir: packageRoot,
    bundle: true,
    conditions: ["production"],
    entryPoints: ["scripts/v8/suite.mjs"],
    format: "esm",
    legalComments: "none",
    logLevel: "info",
    mangleProps: /^_/,
    minify: true,
    outfile: ".jit/suite.mjs",
    platform: "node"
});

const astTargetFile = resolve(packageRoot, ".jit/ast-targets.mjs");
await build({
    absWorkingDir: packageRoot,
    bundle: true,
    conditions: ["production"],
    entryPoints: ["scripts/v8/ast-targets.mjs"],
    format: "esm",
    legalComments: "none",
    logLevel: "info",
    mangleProps: /^_/,
    minify: true,
    outfile: ".jit/ast-targets.mjs",
    platform: "node"
});

const report = await analyzeHotModule({
    input: astTargetFile,
    runtime: "node",
    ignorePackageFiles: [
        resolve(packageRoot, ".jit/ast-plan.mjs"),
        resolve(packageRoot, ".jit/suite.mjs")
    ]
});
if (!report.graphComplete) {
    throw new Error(
        `Generated AST target graph is incomplete:\n${report.diagnostics.join("\n")}`
    );
}

const targetModule = await import(
    `${new URL(astTargetFile, import.meta.url).href}?analysis=${Date.now()}`
);
const targetNames = ["nativePrivateStep", "typeScriptPrivateStep"];
const selectedEvidence = [];
const selectedObligations = [];
const selectedCandidateIds = new Set();
for (const targetName of targetNames) {
    const target = targetModule[targetName];
    if (typeof target !== "function") {
        throw new TypeError(`Generated AST target ${targetName} is not callable`);
    }
    const runtimeSourceSha256 = createHash("sha256")
        .update(Function.prototype.toString.call(target))
        .digest("hex");
    const candidates = report.candidates.filter(
        candidate => candidate.runtimeSourceSha256 === runtimeSourceSha256
    );
    if (candidates.length !== 1) {
        throw new Error(
            `Generated AST target ${targetName} matched ${candidates.length} analyzer candidates`
        );
    }
    const candidate = candidates[0];
    selectedCandidateIds.add(candidate.id);
    const targetEvidence = report.evidence.filter(
        item =>
            item.candidateId === candidate.id &&
            item.automation?.mutationFamily === "numeric-representation"
    );
    if (targetEvidence.length === 0) {
        throw new Error(
            `Generated AST target ${targetName} has no numeric representation evidence`
        );
    }
    for (const item of targetEvidence) {
        selectedEvidence.push(item);
        selectedObligations.push({
            id: `obligation:${item.id}`,
            evidenceId: item.id,
            candidateId: candidate.id,
            mutationFamily: "numeric-representation",
            exportName: targetName,
            parameterIndex: item.automation.parameterIndex,
            parameterPath: item.automation.parameterPath
        });
    }
}

const analyzedSource = await import("node:fs/promises").then(({ readFile }) =>
    readFile(astTargetFile, "utf8")
);
const analysis = {
    runtime: "node",
    entrySourceSha256: createHash("sha256")
        .update(analyzedSource)
        .digest("hex"),
    graphComplete: report.graphComplete,
    diagnostics: report.diagnostics
};
await writeFile(
    resolve(packageRoot, ".jit/ast-plan.mjs"),
    [
        `export const evidence = Object.freeze(${JSON.stringify(selectedEvidence, null, 4)});`,
        `export const obligations = Object.freeze(${JSON.stringify(selectedObligations, null, 4)});`,
        `export const analysis = Object.freeze(${JSON.stringify(analysis, null, 4)});`,
        `export const candidateIds = Object.freeze(${JSON.stringify([...selectedCandidateIds], null, 4)});`,
        ""
    ].join("\n")
);
