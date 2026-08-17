import { describe, expect, test } from "vitest";

import { loadHotSuite } from "../src/worker-shared.js";

const suiteUrl = (fields: string) =>
    `data:text/javascript,${encodeURIComponent(`export default { name: "invalid fixture", setup() { return {}; }, ${fields} };`)}`;

describe("suite manifest validation", () => {
    test("rejects an unknown analyzed runtime", async () => {
        await expect(
            loadHotSuite(
                suiteUrl(
                    'analysis: { runtime: "other", graphComplete: true, diagnostics: [] }, scenarios: []'
                )
            )
        ).rejects.toThrow(/invalid analysis runtime/u);
    });

    test("rejects unknown worker and analyzed-source loaders", async () => {
        await expect(
            loadHotSuite(suiteUrl('workerLoader: "custom", scenarios: []'))
        ).rejects.toThrow(/invalid worker loader/u);
        await expect(
            loadHotSuite(
                suiteUrl(
                    'analysis: { sourceLoader: "custom", graphComplete: true, diagnostics: [] }, scenarios: []'
                )
            )
        ).rejects.toThrow(/invalid source loader/u);
    });

    test("rejects malformed or duplicate external module boundaries", async () => {
        const boundary =
            '{ importer: "index.js", request: "dependency", mode: "import", packageRelativeFile: "index.js" }';
        await expect(
            loadHotSuite(
                suiteUrl(
                    `analysis: { graphComplete: true, diagnostics: [], externalBoundaries: [${boundary}, ${boundary}] }, scenarios: []`
                )
            )
        ).rejects.toThrow(/duplicate external module boundaries/u);
        await expect(
            loadHotSuite(
                suiteUrl(
                    'analysis: { graphComplete: true, diagnostics: [], externalBoundaries: [{ importer: "../outside.js", request: "dependency", mode: "import", packageRelativeFile: "index.js" }] }, scenarios: []'
                )
            )
        ).rejects.toThrow(/invalid external module boundary/u);
    });

    test("rejects duplicate evidence, obligation, and scenario identities", async () => {
        await expect(
            loadHotSuite(
                suiteUrl(
                    'evidence: [{ id: "same" }, { id: "same" }], scenarios: []'
                )
            )
        ).rejects.toThrow(/duplicate evidence IDs/u);
        await expect(
            loadHotSuite(
                suiteUrl(
                    'obligations: [{ id: "same" }, { id: "same" }], scenarios: []'
                )
            )
        ).rejects.toThrow(/duplicate obligation IDs/u);
        await expect(
            loadHotSuite(
                suiteUrl(
                    'scenarios: [{ id: "same", targets: [], run() {} }, { id: "same", targets: [], run() {} }]'
                )
            )
        ).rejects.toThrow(/duplicate scenario IDs/u);
    });

    test("rejects unknown and duplicate scenario obligation claims", async () => {
        await expect(
            loadHotSuite(
                suiteUrl(
                    'scenarios: [{ id: "scenario", targets: [], obligations: ["missing"], run() {} }]'
                )
            )
        ).rejects.toThrow(/unknown obligation missing/u);
        await expect(
            loadHotSuite(
                suiteUrl(
                    'obligations: [{ id: "known", evidenceId: "evidence", candidateId: "candidate", mutationFamily: "object-shape", blockedReason: "fixture" }], scenarios: [{ id: "scenario", targets: [], obligations: ["known", "known"], run() {} }]'
                )
            )
        ).rejects.toThrow(/duplicate obligation claims/u);
    });

    test("rejects an obligation that does not match its analyzer proof", async () => {
        const span = JSON.stringify({
            file: "/fixture.js",
            relativeFile: "fixture.js",
            sourceSha256: "0".repeat(64),
            start: 0,
            end: 1,
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 2
        });
        await expect(
            loadHotSuite(
                suiteUrl(
                    `evidence: [{ id: "evidence", rule: "numeric-operation", candidateId: "candidate", confidence: "dataflow-proven", subject: "fixture", automation: { version: 1, mutationFamily: "numeric-representation", parameterIndex: 0, parameterPath: [] }, span: ${span}, ownerSpan: ${span} }], obligations: [{ id: "obligation", evidenceId: "evidence", candidateId: "candidate", mutationFamily: "object-shape", parameterIndex: 0 }], scenarios: []`
                )
            )
        ).rejects.toThrow(
            /does not match a dataflow-proven analyzer automation proof/u
        );
    });
});
