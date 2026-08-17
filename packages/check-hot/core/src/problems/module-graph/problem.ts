import { defineProblemDefinitions } from "../definition.js";

/** Static graph proof gaps surfaced before scenario generation. */
export const problemDefinitions = defineProblemDefinitions(
    "module-graph",
    "src/problems/module-graph/README.md",
    [
        {
            id: "analysis-module-graph-incomplete",
            title: "Analyzed runtime module graph is incomplete",
            layer: "integrity",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "A dynamic/non-literal edge, remote import, unresolved export pattern, or max-files limit left reachable code unknown."
            ],
            confirmWith: [
                "Inspect every graph diagnostic and external boundary before generating scenarios."
            ],
            remediations: [
                {
                    action: "Make the edge statically resolvable, raise the bounded file limit, or model the boundary in an explicit suite.",
                    when: "The missing edge belongs to the inspected runtime graph; do not expand unrelated dependency packages into core."
                }
            ]
        }
    ] as const
);
