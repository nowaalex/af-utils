import { describe, expect, test } from "vitest";

import type { HotSuite } from "../../src/types.js";
import { createCoverageLedger } from "../../src/worker-shared.js";

const suite: HotSuite = {
    name: "ledger-fixture",
    setup: () => ({}),
    evidence: [
        {
            id: "evidence:callback",
            rule: "callback-parameter-call",
            candidateId: "fixture#map@1",
            confidence: "dataflow-proven",
            subject: "callback parameter call",
            automation: {
                version: 1,
                mutationFamily: "callback-identity",
                parameterIndex: 1,
                parameterPath: []
            },
            span: {
                file: "/fixture.js",
                relativeFile: "fixture.js",
                sourceSha256: "0".repeat(64),
                start: 0,
                end: 1,
                line: 1,
                column: 1,
                endLine: 1,
                endColumn: 2
            },
            ownerSpan: {
                file: "/fixture.js",
                relativeFile: "fixture.js",
                sourceSha256: "0".repeat(64),
                start: 0,
                end: 1,
                line: 1,
                column: 1,
                endLine: 1,
                endColumn: 2
            }
        }
    ],
    obligations: [
        {
            id: "obligation:callback",
            evidenceId: "evidence:callback",
            candidateId: "fixture#map@1",
            mutationFamily: "callback-identity",
            exportName: "map",
            parameterIndex: 1
        },
        {
            id: "obligation:shape",
            evidenceId: "evidence:shape",
            candidateId: "fixture#internal@2",
            mutationFamily: "object-shape",
            blockedReason: "not a direct export"
        }
    ],
    scenarios: [
        {
            id: "map:callback-family",
            targets: [],
            obligations: ["obligation:callback"],
            run() {}
        },
        { id: "unrelated", targets: [], run() {} }
    ]
};

describe("typed AST coverage ledger", () => {
    test("passes only an exact-family scenario and keeps blocked work visible", () => {
        const ledger = createCoverageLedger(
            suite,
            ["map:callback-family"],
            "passed",
            [
                {
                    obligationId: "obligation:callback",
                    evidenceId: "evidence:callback",
                    mutationFamily: "callback-identity",
                    scenarioId: "map:callback-family",
                    sampleId: "map:callback-family",
                    status: "accepted",
                    siteHitCount: 1,
                    semanticVerification: "mutation-verified",
                    mutationPlan: {
                        mode: "adapter-owned",
                        warmupVariants: ["adapter-baseline:callable-class-0"],
                        stressVariants: [
                            "adapter-variant-0",
                            "adapter-variant-1",
                            "adapter-variant-2",
                            "adapter-variant-3",
                            "adapter-variant-4",
                            "adapter-variant-5"
                        ],
                        excludedVariants: [],
                        observations: [
                            {
                                variant: "adapter-baseline",
                                representation: "callable-class-0",
                                verified: true,
                                siteHitCount: 1,
                                replayFingerprint: "0".repeat(64)
                            },
                            ...Array.from({ length: 6 }, (_, index) => ({
                                variant: `adapter-variant-${index}`,
                                representation: `callable-class-${index + 1}`,
                                verified: true,
                                siteHitCount: 1,
                                guardedSiteHitCount: 1,
                                replayFingerprint: String(index + 1).repeat(64)
                            }))
                        ]
                    }
                }
            ]
        );

        expect(ledger).toEqual([
            expect.objectContaining({
                obligationId: "obligation:callback",
                status: "passed",
                scenarios: ["map:callback-family"]
            }),
            expect.objectContaining({
                obligationId: "obligation:shape",
                status: "blocked",
                reason: "not a direct export"
            })
        ]);
    });

    test("does not count an unrelated or unselected recipe as coverage", () => {
        expect(
            createCoverageLedger(suite, ["unrelated"], "passed")[0]
        ).toMatchObject({ status: "ignored", scenarios: [] });
    });
});
