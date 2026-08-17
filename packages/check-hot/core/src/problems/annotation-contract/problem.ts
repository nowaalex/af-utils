import { defineProblemDefinitions } from "../definition.js";

/** Source-marker contract problems detected before runtime measurement. */
export const problemDefinitions = defineProblemDefinitions(
    "annotation-contract",
    "src/problems/annotation-contract/README.md",
    [
        {
            id: "annotation-contract-mismatch",
            title: "check-hot annotation does not match its target",
            layer: "integrity",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "A marker is stale, duplicated, detached, or names a different declared target."
            ],
            confirmWith: [
                "Compare the marker owner and exact target ID reported by annotation validation."
            ],
            remediations: [
                {
                    action: "Move or rename the marker so it immediately owns exactly one declared target.",
                    when: "The marker is intended to provide coverage identity; otherwise remove the marker and its declaration together."
                }
            ]
        }
    ] as const
);
