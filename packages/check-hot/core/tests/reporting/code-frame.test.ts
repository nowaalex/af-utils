import { describe, expect, test } from "vitest";

import { formatHotAnalysis } from "../../src/analyzer.js";
import type { HotAnalysisReport } from "../../src/analyzer.js";

const finding = {
    rule: "heterogeneous-array-literal",
    severity: "warning" as const,
    message: "heterogeneous literal",
    suggestion: "measure it",
    file: "/fixture.js",
    line: 1,
    column: 29,
    endLine: 1,
    endColumn: 52,
    start: 28,
    end: 51,
    sourceLine: "export function hot() { const array = [-2, null, () => {}]; }",
    sourceLines: [
        "export function hot() { const array = [-2, null, () => {}]; }"
    ],
    functionId: "fixture.js#hot@1"
};

const report: HotAnalysisReport = {
    input: "/fixture.js",
    entry: "/fixture.js",
    entrySourceSha256: "0".repeat(64),
    entryPackagePath: "fixture.js",
    publicEntries: [
        {
            modulePath: ".",
            entryPackagePath: "fixture.js",
            entrySourceSha256: "0".repeat(64)
        }
    ],
    sourceGraph: [{ relativeFile: "fixture.js", sourceSha256: "0".repeat(64) }],
    packageTree: {
        sourceSha256: "0".repeat(64),
        fileCount: 1,
        ignoredRelativeFiles: []
    },
    runtime: "node",
    files: 1,
    diagnostics: [],
    externalBoundaries: [],
    graphComplete: true,
    candidates: [
        {
            id: "fixture.js#hot@1",
            name: "hot",
            kind: "function",
            exportName: "hot",
            targetId: "hot",
            publicTargets: [{ modulePath: ".", exportPath: ["hot"] }],
            publicPaths: ["hot"],
            exported: true,
            arity: 0,
            parameterNames: [],
            score: 10,
            reasons: ["public/exported API"],
            file: "/fixture.js",
            start: 0,
            end: 65,
            sourceSha256: "0".repeat(64),
            runtimeSourceSha256: "0".repeat(64),
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 66,
            metrics: {
                lines: 1,
                branches: 0,
                loops: 0,
                calls: 0,
                allocationsInLoops: 0,
                dynamicKeyedAccesses: 0
            },
            findings: [finding]
        }
    ],
    findings: [finding],
    evidence: [],
    obligations: [],
    limitations: []
};

describe("human code frames", () => {
    test("supports forced ANSI colors while keeping source text readable", () => {
        const output = formatHotAnalysis(report, {
            color: "always",
            codeFrame: true
        });

        expect(output).toContain("\u001B[");
        expect(output).toContain("const array = [-2, null, () => {}]");
        expect(output).toContain("^");
        expect(JSON.stringify(report)).not.toContain("\u001b[");
    });

    test("renders multiline CRLF source with tabs and Unicode", () => {
        const multilineFinding = {
            ...finding,
            line: 4,
            column: 2,
            endLine: 6,
            endColumn: 7,
            sourceLine: "\tconst café = [",
            sourceLines: ["\tconst café = [", '\t\t"🔥",', "\t\tnull];"]
        };
        const output = formatHotAnalysis(
            {
                ...report,
                candidates: [
                    {
                        ...report.candidates[0],
                        findings: [multilineFinding]
                    }
                ],
                findings: [multilineFinding]
            },
            { color: "never", codeFrame: true }
        );

        expect(output).toContain("4 │     const café = [");
        expect(output).toContain('5 │         "🔥",');
        expect(output).toContain("6 │         null];");
        expect(output).not.toContain("\r");
        expect(output).not.toContain("\u001B[");
    });
});
