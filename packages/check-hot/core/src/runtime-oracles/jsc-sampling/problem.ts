import { defineProblemDefinitions } from "../../problems/definition.js";

/** Non-gating gaps emitted by optional Bun/JSC sampling. */
export const problemDefinitions = defineProblemDefinitions(
    "jsc-sampling",
    "src/runtime-oracles/jsc-sampling/README.md",
    [
        {
            id: "jsc-sampling-diagnostic-gap",
            title: "JavaScriptCore sampling evidence is incomplete",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The runtime is not Bun, bun:jsc.profile is unavailable, the diagnostic worker failed, or no tier samples were observed."
            ],
            confirmWith: [
                "Inspect the exact Bun/JSC version, diagnostic status, total samples, and formatted public tier breakdown."
            ],
            remediations: [
                {
                    action: "Use a Bun build with the public sampling API or collect a longer representative diagnostic workload.",
                    when: "Tier distribution is needed only as advisory context; current JSC tier remains unobservable."
                }
            ]
        }
    ] as const
);
