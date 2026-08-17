import { defineProblemDefinitions } from "../definition.js";

/** Identity/resolution problems that invalidate previously generated evidence. */
export const problemDefinitions = defineProblemDefinitions(
    "source-integrity",
    "src/problems/source-integrity/README.md",
    [
        {
            id: "source-integrity-mismatch",
            title: "Analyzed or probed source identity changed",
            layer: "integrity",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "Analyzed source, a probe runner, dependency graph, or resolver-sensitive file changed after the plan was generated."
            ],
            confirmWith: [
                "Compare the expected and actual SHA-256/package-tree identities retained in the report."
            ],
            remediations: [
                {
                    action: "Regenerate the analysis/probe manifest from the exact current package tree.",
                    when: "The changed files are intentional and reviewed; otherwise restore the expected artifact."
                }
            ]
        },
        {
            id: "runtime-resolution-mismatch",
            title: "Runtime resolved a different public artifact",
            layer: "integrity",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "Runtime conditions, hooks, symlinks, extensions, or configuration selected a different public artifact than static analysis."
            ],
            confirmWith: [
                "Compare analyzer and native runtime resolutions for the failing public root/subpath and exact runtime version."
            ],
            remediations: [
                {
                    action: "Remove resolution-changing hooks or generate a separate evidence plan under the intended runtime conditions.",
                    when: "The alternate artifact is the supported consumer entry rather than an accidental environment difference."
                }
            ]
        }
    ] as const
);
