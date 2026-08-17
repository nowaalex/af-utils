import { defineProblemDefinitions } from "../../problems/definition.js";

/** Non-gating gaps emitted by the optional CPU sampling rerun. */
export const problemDefinitions = defineProblemDefinitions(
    "cpu-hotness",
    "src/runtime-oracles/cpu-hotness/README.md",
    [
        {
            id: "cpu-profile-diagnostic-gap",
            title: "CPU hotness evidence is incomplete",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The diagnostic worker/profile failed, exceeded its size cap, or sampled no target work."
            ],
            confirmWith: [
                "Inspect the separate diagnostic status, raw profile, total samples, and unobserved candidate list."
            ],
            remediations: [
                {
                    action: "Increase representative diagnostic work or repair profile collection without changing the primary matrix cell.",
                    when: "Hotness prioritization is needed; zero samples must remain unobserved rather than passed."
                }
            ]
        }
    ] as const
);
