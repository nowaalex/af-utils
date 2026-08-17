import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import type { HotAstEvidence } from "../../types.js";
import { authenticateCpuOwners, parseCpuProfile } from "./parse.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map(path => rm(path, { force: true, recursive: true }))
    );
});

const evidenceFor = (
    file: string,
    candidateId: string,
    sourceSha256: string,
    start = 0,
    end = 10
): HotAstEvidence => ({
    id: `${candidateId}:${start}`,
    rule: "numeric-operation",
    candidateId,
    confidence: "dataflow-proven",
    subject: "fixture",
    span: {
        file,
        relativeFile: file.split("/").at(-1) ?? file,
        sourceSha256,
        start,
        end,
        line: 1,
        column: start + 1,
        endLine: 1,
        endColumn: end + 1
    },
    ownerSpan: {
        file,
        relativeFile: file.split("/").at(-1) ?? file,
        sourceSha256,
        start,
        end,
        line: 1,
        column: start + 1,
        endLine: 1,
        endColumn: end + 1
    }
});

describe("CPU hotness profile", () => {
    test("ranks samples and only uses exact correlation for a unique owner", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        callFrame: {
                            functionName: "hot",
                            url: "file:///tmp/hot.js",
                            lineNumber: 4,
                            columnNumber: 2
                        }
                    },
                    {
                        id: 2,
                        callFrame: { functionName: "cold", url: "" }
                    }
                ],
                samples: [1, 1, 2]
            }),
            [
                {
                    candidateId: "candidate:hot",
                    file: "/tmp/hot.js",
                    startLine: 1,
                    startColumn: 1,
                    endLine: 10,
                    endColumn: 20
                }
            ]
        );
        expect(result.oracleVersion).toBe("1");
        expect(result.totalSamples).toBe(3);
        expect(result.unattributedSamples).toBe(0);
        expect(result.functions[0]).toMatchObject({
            candidateId: "candidate:hot",
            correlation: "target",
            samples: 2
        });
        expect(result.functions[1]?.correlation).toBe("name-only");
        expect(result.unobservedCandidateIds).toEqual([]);
        expect(result.functions.map(entry => entry.sampleShare)).toEqual([
            2 / 3,
            1 / 3
        ]);
        expect(result.gap).toBeUndefined();
    });

    test("keeps zero samples explicitly unobserved", () => {
        const result = parseCpuProfile('{"nodes":[],"samples":[]}');
        expect(result.gap).toContain("unobserved");
        expect(result.functions).toEqual([]);
        expect(result.unobservedCandidateIds).toEqual([]);
        expect(result.unattributedSamples).toBe(0);

        const withOwner = parseCpuProfile('{"nodes":[],"samples":[]}', [
            {
                candidateId: "candidate:hot",
                file: "/tmp/hot.js",
                startLine: 1,
                startColumn: 1,
                endLine: 2,
                endColumn: 1
            }
        ]);
        expect(withOwner.gap).toBe(
            "The profiler observed zero samples; target hotness is unobserved, not passed."
        );
        expect(withOwner.unobservedCandidateIds).toEqual(["candidate:hot"]);
    });

    test("treats an exclusive owner end as outside exact correlation", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        callFrame: {
                            functionName: "next",
                            url: "file:///tmp/hot.js",
                            lineNumber: 0,
                            columnNumber: 9
                        }
                    }
                ],
                samples: [1]
            }),
            [
                {
                    candidateId: "candidate:ended",
                    file: "/tmp/hot.js",
                    startLine: 1,
                    startColumn: 1,
                    endLine: 1,
                    endColumn: 10
                }
            ]
        );
        expect(result.functions[0]?.correlation).toBe("source-line");
        expect(result.unobservedCandidateIds).toEqual(["candidate:ended"]);
    });

    test("aggregates frames and preserves every honest correlation level", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        callFrame: {
                            functionName: "hot",
                            url: "file:///tmp/hot.js",
                            lineNumber: 0,
                            columnNumber: 0
                        }
                    },
                    {
                        id: 2,
                        callFrame: {
                            functionName: "hot",
                            url: "file:///tmp/hot.js",
                            lineNumber: 0,
                            columnNumber: 0
                        }
                    },
                    {
                        id: 3,
                        callFrame: {
                            functionName: "outside",
                            url: "file:///tmp/hot.js",
                            lineNumber: 20,
                            columnNumber: 0
                        }
                    },
                    {
                        id: 4,
                        callFrame: { functionName: "named", url: "" }
                    },
                    { id: 5, callFrame: { functionName: "", url: "" } }
                ],
                samples: [1, 2, 3, 4, 5]
            }),
            [
                {
                    candidateId: "candidate:hot",
                    file: "/tmp/hot.js",
                    startLine: 1,
                    startColumn: 1,
                    endLine: 2,
                    endColumn: 1
                }
            ]
        );

        expect(result.functions).toEqual([
            expect.objectContaining({
                functionName: "hot",
                samples: 2,
                sampleShare: 0.4,
                candidateId: "candidate:hot",
                correlation: "target",
                line: 1,
                column: 1
            }),
            expect.objectContaining({
                functionName: "outside",
                correlation: "source-line",
                samples: 1
            }),
            expect.objectContaining({
                functionName: "named",
                correlation: "name-only",
                samples: 1
            }),
            expect.objectContaining({
                functionName: "anonymous",
                correlation: "unavailable",
                samples: 1
            })
        ]);
    });

    test("reports unknown and partially attributable sample IDs", () => {
        const node = {
            id: 1,
            callFrame: { functionName: "known", url: "" }
        };
        const unknown = parseCpuProfile(
            JSON.stringify({ nodes: [node], samples: [999, "bad"] })
        );
        const partial = parseCpuProfile(
            JSON.stringify({ nodes: [node], samples: [1, 999] })
        );

        expect(unknown).toMatchObject({
            totalSamples: 0,
            unattributedSamples: 2,
            functions: []
        });
        expect(unknown.gap).toContain("None of 2");
        expect(partial).toMatchObject({
            totalSamples: 1,
            unattributedSamples: 1
        });
        expect(partial.functions[0]?.sampleShare).toBe(1);
        expect(partial.gap).toContain("shares use only the 1 attributable");
    });

    test("uses hit counts only when samples are absent", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        hitCount: 3,
                        callFrame: { functionName: "hot", url: "" }
                    },
                    {
                        id: 2,
                        hitCount: 0,
                        callFrame: { functionName: "cold", url: "" }
                    }
                ]
            })
        );

        expect(result.totalSamples).toBe(3);
        expect(result.functions).toEqual([
            expect.objectContaining({
                functionName: "hot",
                samples: 3,
                sampleShare: 1
            })
        ]);
        expect(result.gap).toBeUndefined();

        const explicitEmptySamples = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        hitCount: 9,
                        callFrame: { functionName: "not-sampled", url: "" }
                    }
                ],
                samples: []
            })
        );
        expect(explicitEmptySamples).toMatchObject({
            totalSamples: 0,
            functions: [],
            gap: expect.stringContaining("zero samples")
        });
    });

    test("uses file URLs, plain URLs, and malformed file URLs conservatively", () => {
        const nodes = [
            [1, "https://example.test/hot.js"],
            [2, "file:///%"]
        ].map(([id, url]) => ({
            id,
            callFrame: {
                functionName: `hot${id}`,
                url,
                lineNumber: 0,
                columnNumber: 0
            }
        }));
        const result = parseCpuProfile(
            JSON.stringify({ nodes, samples: [1, 2] }),
            [
                {
                    candidateId: "plain-url",
                    file: "https://example.test/hot.js",
                    startLine: 1,
                    startColumn: 1,
                    endLine: 2,
                    endColumn: 1
                },
                {
                    candidateId: "malformed-file-url",
                    file: "file:///%",
                    startLine: 1,
                    startColumn: 1,
                    endLine: 2,
                    endColumn: 1
                }
            ]
        );

        expect(
            result.functions.map(entry => entry.candidateId).toSorted()
        ).toEqual(["malformed-file-url", "plain-url"]);
    });

    test.each([
        ["different file", "/tmp/other.js", 2, 3, false],
        ["before start line", "/tmp/hot.js", 1, 3, false],
        ["before start column", "/tmp/hot.js", 2, 2, false],
        ["at start", "/tmp/hot.js", 2, 3, true],
        ["inside", "/tmp/hot.js", 3, 1, true],
        ["before exclusive end", "/tmp/hot.js", 4, 6, true],
        ["at exclusive end", "/tmp/hot.js", 4, 7, false],
        ["after end", "/tmp/hot.js", 5, 1, false]
    ])(
        "checks authenticated owner boundary: %s",
        (_label, file, line, column, expected) => {
            const result = parseCpuProfile(
                JSON.stringify({
                    nodes: [
                        {
                            id: 1,
                            callFrame: {
                                functionName: "boundary",
                                url: `file://${file}`,
                                lineNumber: (line as number) - 1,
                                columnNumber: (column as number) - 1
                            }
                        }
                    ],
                    samples: [1]
                }),
                [
                    {
                        candidateId: "candidate:boundary",
                        file: "/tmp/hot.js",
                        startLine: 2,
                        startColumn: 3,
                        endLine: 4,
                        endColumn: 7
                    }
                ]
            );
            expect(result.functions[0]?.candidateId).toBe(
                expected ? "candidate:boundary" : undefined
            );
        }
    );

    test.each([
        [null],
        [{ id: "1", callFrame: {} }],
        [{ id: 0, callFrame: {} }],
        [{ id: 1.5, callFrame: {} }],
        [{ id: 1, callFrame: null }]
    ])("rejects invalid CPU profile node %j", node => {
        const result = parseCpuProfile(
            JSON.stringify({ nodes: [node], samples: [1] })
        );
        expect(result).toMatchObject({
            totalSamples: 0,
            unattributedSamples: 1,
            functions: [],
            gap: expect.stringContaining("invalid profile node")
        });
    });

    test("drops malformed optional call-frame fields without inventing correlation", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        hitCount: 1,
                        callFrame: {
                            functionName: 7,
                            url: 8,
                            lineNumber: -1,
                            columnNumber: 1.5
                        }
                    },
                    {
                        id: 2,
                        hitCount: 2,
                        callFrame: {
                            functionName: "line-only",
                            url: "file:///tmp/hot.js",
                            lineNumber: 0,
                            columnNumber: -1
                        }
                    }
                ]
            })
        );
        expect(result.functions).toEqual([
            expect.objectContaining({
                functionName: "line-only",
                url: "file:///tmp/hot.js",
                line: 1,
                column: undefined,
                samples: 2,
                correlation: "source-line"
            }),
            expect.objectContaining({
                functionName: "anonymous",
                url: undefined,
                line: undefined,
                column: undefined,
                samples: 1,
                correlation: "unavailable"
            })
        ]);
    });

    test("does not exact-correlate frames with incomplete source coordinates", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        callFrame: {
                            functionName: "missing-line",
                            url: "file:///tmp/hot.js",
                            columnNumber: 0
                        }
                    },
                    {
                        id: 2,
                        callFrame: {
                            functionName: "missing-column",
                            url: "file:///tmp/hot.js",
                            lineNumber: 0
                        }
                    },
                    {
                        id: 3,
                        callFrame: {
                            functionName: "missing-url",
                            lineNumber: 0,
                            columnNumber: 0
                        }
                    }
                ],
                samples: [1, 2, 3]
            }),
            [
                {
                    candidateId: "candidate:must-remain-unobserved",
                    file: "/tmp/hot.js",
                    startLine: 1,
                    startColumn: 1,
                    endLine: 2,
                    endColumn: 1
                }
            ]
        );
        expect(result.functions).toEqual([
            expect.objectContaining({
                functionName: "missing-line",
                candidateId: undefined,
                correlation: "name-only"
            }),
            expect.objectContaining({
                functionName: "missing-column",
                candidateId: undefined,
                correlation: "source-line"
            }),
            expect.objectContaining({
                functionName: "missing-url",
                candidateId: undefined,
                correlation: "name-only"
            })
        ]);
        expect(result.unobservedCandidateIds).toEqual([
            "candidate:must-remain-unobserved"
        ]);
    });

    test("keeps duplicate-node hit counts unattributed", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    { id: 1, hitCount: 2, callFrame: { functionName: "a" } },
                    { id: 1, hitCount: 3, callFrame: { functionName: "b" } },
                    { id: 1, hitCount: 4, callFrame: { functionName: "c" } }
                ]
            })
        );
        expect(result).toMatchObject({
            totalSamples: 0,
            unattributedSamples: 9,
            functions: [],
            gap: expect.stringContaining("duplicate profile node IDs")
        });
    });

    test("reports global samples as unobserved target work", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        callFrame: {
                            functionName: "runtimeStartup",
                            url: "file:///runtime/bootstrap.js",
                            lineNumber: 0,
                            columnNumber: 0
                        }
                    }
                ],
                samples: [1, 1]
            }),
            [
                {
                    candidateId: "candidate:hot",
                    file: "/tmp/hot.js",
                    startLine: 1,
                    startColumn: 1,
                    endLine: 2,
                    endColumn: 1
                }
            ]
        );
        expect(result.unobservedCandidateIds).toEqual(["candidate:hot"]);
        expect(result.gap).toContain(
            "no authenticated analyzer candidate was sampled"
        );
    });

    test.each([
        ["not-json", "valid CPU profile JSON"],
        ["null", "no valid node table"],
        ["{}", "no valid node table"],
        ['{"nodes":"bad"}', "no valid node table"]
    ])("rejects malformed profile %s", (raw, expected) => {
        const result = parseCpuProfile(raw, [
            {
                candidateId: "candidate:z",
                file: "/tmp/z.js",
                startLine: 1,
                startColumn: 1,
                endLine: 2,
                endColumn: 1
            }
        ]);

        expect(result.totalSamples).toBe(0);
        expect(result.unattributedSamples).toBe(0);
        expect(result.functions).toEqual([]);
        expect(result.unobservedCandidateIds).toEqual(["candidate:z"]);
        expect(result.gap).toContain(expected);
    });

    test("returns exact terminal summaries for corrupt JSON and missing nodes", () => {
        const owner = {
            candidateId: "candidate:z",
            file: "/tmp/z.js",
            startLine: 1,
            startColumn: 1,
            endLine: 2,
            endColumn: 1
        };
        expect(parseCpuProfile("not-json", [owner])).toEqual({
            oracleVersion: "1",
            totalSamples: 0,
            unattributedSamples: 0,
            functions: [],
            unobservedCandidateIds: ["candidate:z"],
            gap: "The runtime did not produce valid CPU profile JSON."
        });
        expect(parseCpuProfile("{}", [owner])).toEqual({
            oracleVersion: "1",
            totalSamples: 0,
            unattributedSamples: 0,
            functions: [],
            unobservedCandidateIds: ["candidate:z"],
            gap: "The CPU profile has no valid node table."
        });
    });

    test("retains a valid node next to an invalid node", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    null,
                    {
                        id: 1,
                        callFrame: { functionName: "valid", url: "" }
                    }
                ],
                samples: [1]
            })
        );
        expect(result.functions).toEqual([
            expect.objectContaining({ functionName: "valid", samples: 1 })
        ]);
        expect(result.gap).toBe(
            "The CPU profile is only partially usable: invalid profile node."
        );
    });

    test("rejects duplicate node IDs and malformed node tables", () => {
        const duplicate = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    { id: 1, callFrame: { functionName: "first" } },
                    { id: 1, callFrame: { functionName: "second" } },
                    { id: 0, callFrame: {} },
                    { id: 2 },
                    "bad"
                ],
                samples: [1, 1, 0, 2]
            })
        );

        expect(duplicate.totalSamples).toBe(0);
        expect(duplicate.unattributedSamples).toBe(4);
        expect(duplicate.gap).toContain("invalid profile node");
        expect(duplicate.gap).toContain("duplicate profile node IDs");
    });

    test("reports invalid hit counts and a malformed sample table", () => {
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        hitCount: -1,
                        callFrame: { functionName: "negative" }
                    },
                    {
                        id: 2,
                        hitCount: 1.5,
                        callFrame: { functionName: "fraction" }
                    }
                ],
                samples: "not-an-array"
            })
        );

        expect(result.gap).toBe(
            "The CPU profile is only partially usable: invalid profile sample table; invalid hit count for node 1; invalid hit count for node 2."
        );
    });

    test("does not choose between overlapping authenticated owners", () => {
        const owners = ["candidate:z", "candidate:a", "candidate:a"].map(
            candidateId => ({
                candidateId,
                file: "/tmp/hot.js",
                startLine: 1,
                startColumn: 1,
                endLine: 2,
                endColumn: 1
            })
        );
        const result = parseCpuProfile(
            JSON.stringify({
                nodes: [
                    {
                        id: 1,
                        callFrame: {
                            functionName: "ambiguous",
                            url: "file:///tmp/hot.js",
                            lineNumber: 0,
                            columnNumber: 0
                        }
                    }
                ],
                samples: [1]
            }),
            owners
        );

        expect(result.functions[0]).toMatchObject({
            candidateId: undefined,
            correlation: "source-line"
        });
        expect(result.unobservedCandidateIds).toEqual([
            "candidate:a",
            "candidate:z"
        ]);
    });

    test("authenticates unchanged JavaScript owners and deduplicates evidence", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-cpu-owner-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "owner.js");
        const source = "export function hot(value) { return value + 1; }\n";
        await writeFile(file, source);
        const sha256 = createHash("sha256").update(source).digest("hex");
        const evidence = evidenceFor(file, "candidate:hot", sha256);

        await expect(
            authenticateCpuOwners([evidence, { ...evidence, id: "second" }])
        ).resolves.toEqual([
            {
                candidateId: "candidate:hot",
                file,
                startLine: 1,
                startColumn: 1,
                endLine: 1,
                endColumn: 11
            }
        ]);
        await expect(
            authenticateCpuOwners([
                {
                    ...evidence,
                    ownerSpan: { ...evidence.ownerSpan, file: `${file}.ts` }
                }
            ])
        ).resolves.toEqual([]);
    });

    test("rejects stale, conflicting, and unreadable owner identities", async () => {
        const directory = await mkdtemp(join(tmpdir(), "check-hot-cpu-owner-"));
        temporaryDirectories.push(directory);
        const file = join(directory, "owner.js");
        await writeFile(file, "export const hot = value => value;\n");
        const stale = evidenceFor(file, "candidate:stale", "0".repeat(64));
        await expect(authenticateCpuOwners([stale])).resolves.toEqual([]);

        const conflicting = [
            evidenceFor(file, "candidate:conflict", "0".repeat(64), 0, 10),
            evidenceFor(file, "candidate:conflict", "0".repeat(64), 1, 10)
        ];
        await expect(authenticateCpuOwners(conflicting)).resolves.toEqual([]);

        const base = evidenceFor(
            file,
            "candidate:every-conflict",
            createHash("sha256")
                .update("export const hot = value => value;\n")
                .digest("hex"),
            0,
            10
        );
        for (const ownerSpan of [
            { ...base.ownerSpan, file: `${file}.mjs` },
            { ...base.ownerSpan, end: 11 },
            { ...base.ownerSpan, sourceSha256: "1".repeat(64) }
        ]) {
            // oxlint-disable-next-line no-await-in-loop -- Every identity field is an independent ambiguity guard.
            await expect(
                authenticateCpuOwners([
                    base,
                    { ...base, id: `conflict:${ownerSpan.end}`, ownerSpan },
                    { ...base, id: "after-conflict" }
                ])
            ).resolves.toEqual([]);
        }

        const missing = evidenceFor(
            join(directory, "missing.js"),
            "candidate:missing",
            "0".repeat(64)
        );
        await expect(authenticateCpuOwners([missing])).rejects.toThrow(
            "ENOENT"
        );
    });
});
