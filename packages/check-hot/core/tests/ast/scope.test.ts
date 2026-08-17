import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { analyzeHotModule } from "../../src/analyzer.js";

const directories: string[] = [];

afterEach(async () => {
    await Promise.all(
        directories
            .splice(0)
            .map(directory => rm(directory, { force: true, recursive: true }))
    );
});

describe("lexical scope provenance", () => {
    test("ignores a shadowed require without hiding a real outer require edge", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.cjs");
        await writeFile(
            join(directory, "dependency.cjs"),
            "exports.value = 1;"
        );
        await writeFile(
            entry,
            [
                "const dependency = require('./dependency.cjs');",
                "function local(require) { return require('./not-a-module.cjs'); }",
                "exports.read = () => dependency.value;"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });

        expect(report.files).toBe(2);
        expect(report.graphComplete).toBe(true);
        expect(report.diagnostics.join("\n")).not.toContain("not-a-module");
    });

    test("does not confuse block-shadowed names with public parameters", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            [
                "export function shadowed(value, callback, key, source) {",
                "  {",
                "    const value = 1;",
                "    const callback = () => value;",
                "    const key = 'local';",
                "    callback();",
                "    return value + source[key];",
                "  }",
                "}"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        const candidate = report.candidates.find(
            value => value.name === "shadowed"
        );
        const callback = candidate?.findings.find(
            finding => finding.rule === "callback-parameter-call"
        );
        const numeric = candidate?.findings.find(
            finding => finding.rule === "numeric-operation"
        );
        const keyed = candidate?.findings.find(
            finding => finding.rule === "dynamic-keyed-access"
        );

        expect(callback).toBeUndefined();
        expect(numeric).toBeUndefined();
        expect(keyed?.parameterIndex).toBeUndefined();
    });

    test("keeps destructured bindings attached to their argument index", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            [
                "export function hot({ callback, value }, [key]) {",
                "  callback();",
                "  const sum = value + 1;",
                "  return { sum, key };",
                "}"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        const candidate = report.candidates[0];
        const callback = candidate.findings.find(
            finding => finding.rule === "callback-parameter-call"
        );
        const numeric = candidate.findings.find(
            finding => finding.rule === "numeric-operation"
        );

        expect(callback?.parameterIndex).toBe(0);
        expect(callback?.parameterPath).toEqual(["callback"]);
        expect(numeric?.parameterIndex).toBe(0);
        expect(numeric?.parameterPath).toEqual(["value"]);
        expect(candidate.parameterNames).toEqual(["callback", "value", "key"]);
        expect(
            report.obligations.find(
                obligation =>
                    report.evidence.find(
                        evidence => evidence.id === obligation.evidenceId
                    )?.rule === "numeric-operation"
            )
        ).toMatchObject({ parameterIndex: 0, parameterPath: ["value"] });
    });

    test("kills parameter and alias provenance after assignment", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            [
                "export function reassigned(value) { value = 1; return value + 1; }",
                "export function aliasReassigned(value) { let alias = value; alias = 1; return alias + 1; }"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        for (const name of ["reassigned", "aliasReassigned"]) {
            const candidate = report.candidates.find(
                value => value.name === name
            );
            expect(
                candidate?.findings.find(
                    finding => finding.rule === "numeric-operation"
                )?.parameterIndex
            ).toBeUndefined();
        }
    });

    test("blocks automation for loop, pattern, closure, and dynamic-scope writes", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            [
                "export function loopWrite(value) { for (value of [1]) return value + 1; }",
                "export function patternWrite(value) { ({ value } = { value: 1 }); return value + 1; }",
                "export function closureWrite(value) { let alias = value; [0].forEach(() => { alias = 1; }); return alias + 1; }",
                "export function iifeWrite(value) { (() => { value = 1; })(); return value + 1; }",
                "export function evalWrite(value) { eval('value = 1'); return value + 1; }"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        for (const name of [
            "loopWrite",
            "patternWrite",
            "closureWrite",
            "iifeWrite",
            "evalWrite"
        ]) {
            const candidate = report.candidates.find(
                value => value.name === name
            );
            expect(
                candidate?.findings.find(
                    finding => finding.rule === "numeric-operation"
                )?.parameterIndex
            ).toBeUndefined();
            expect(
                report.obligations.some(
                    obligation => obligation.candidateId === candidate?.id
                )
            ).toBe(false);
        }
    });

    test("models switch lexical scope and refuses dynamic destructuring paths", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            [
                "const dynamic = 'actual';",
                "export function switchShadow(value, which) { switch (which) { case 1: { let value = 1; return value + 1; } default: return 0; } }",
                "export function computed({ [dynamic]: value }) { return value + 1; }",
                "export function literal({ ['actual']: value }) { return value + 1; }"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        const numericFor = (name: string) =>
            report.candidates
                .find(candidate => candidate.name === name)
                ?.findings.find(
                    finding => finding.rule === "numeric-operation"
                );

        expect(numericFor("switchShadow")?.parameterIndex).toBeUndefined();
        expect(numericFor("computed")).toBeDefined();
        expect(numericFor("computed")?.parameterIndex).toBeUndefined();
        expect(numericFor("literal")?.parameterIndex).toBe(0);
        expect(numericFor("literal")?.parameterPath).toEqual(["actual"]);
    });

    test("reaches a parameter through an eight-hop alias fixpoint", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            "export function hot(value) { const a=value,b=a,c=b,d=c,e=d,f=e,g=f,h=g; return h + 1; }"
        );

        const report = await analyzeHotModule({ input: entry });
        expect(
            report.findings.find(
                finding => finding.rule === "numeric-operation"
            )?.parameterIndex
        ).toBe(0);
    });

    test("does not promote a derived expression that shares its first token offset", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            [
                "export function derivedLength(array) {",
                "  const length = array.length;",
                "  return length / 2;",
                "}",
                "export function derivedKey(record, key) {",
                "  const alias = record.nested;",
                "  return alias[key + '-suffix'];",
                "}"
            ].join("\n")
        );

        const report = await analyzeHotModule({ input: entry });
        const lengthCandidate = report.candidates.find(
            value => value.name === "derivedLength"
        );
        const keyCandidate = report.candidates.find(
            value => value.name === "derivedKey"
        );
        const numeric = lengthCandidate?.findings.find(
            finding => finding.rule === "numeric-operation"
        );
        const keyed = keyCandidate?.findings.find(
            finding => finding.rule === "dynamic-keyed-access"
        );

        expect(numeric).toBeUndefined();
        expect(keyed).toBeDefined();
        expect(keyed?.parameterIndex).toBeUndefined();
    });

    test("tracks rest bindings as advisory but never as a direct argument mutator", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-scope-"));
        directories.push(directory);
        const entry = join(directory, "index.js");
        await writeFile(
            entry,
            "export function hot(...values) { return values[0] + 1; }"
        );

        const report = await analyzeHotModule({ input: entry });
        const indexed = report.findings.find(
            finding => finding.rule === "parameter-indexed-access"
        );
        expect(indexed).toBeDefined();
        expect(indexed?.parameterIndex).toBeUndefined();
        expect(report.obligations).toHaveLength(0);
    });
});
