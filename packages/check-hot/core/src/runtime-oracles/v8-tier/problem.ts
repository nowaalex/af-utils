import { defineProblemDefinitions } from "../../problems/definition.js";

/** Problems emitted by V8 tier inspection. */
export const problemDefinitions = defineProblemDefinitions(
    "v8-tier",
    "src/runtime-oracles/v8-tier/README.md",
    [
        {
            id: "v8-tier-mismatch",
            title: "Requested V8 tier is not active",
            layer: "runtime",
            outcome: "failure",
            evidence: "engine-confirmed",
            likelyCauses: [
                "The target deoptimized, never reached the requested tier, or the workload trained a different optimization path."
            ],
            confirmWith: [
                "Inspect active-tier intrinsics, status bits, guarded deopts, and isolated scenario invocation counts."
            ],
            remediations: [
                {
                    action: "Fix the confirmed destabilizing transition or make warmup representative; do not force optimization blindly.",
                    when: "The requested tier exists in this V8 build and the target is genuinely hot in production."
                }
            ]
        },
        {
            id: "v8-tier-oracle-unsupported",
            title: "V8 tier oracle is unavailable",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The runtime build lacks required native intrinsics or the requested tier is unavailable/disabled."
            ],
            confirmWith: [
                "Check the exact V8 version, flags, and the missing intrinsic reported before target execution."
            ],
            remediations: [
                {
                    action: "Select a supported runtime/tier or implement a separately versioned oracle with equivalent active-tier evidence.",
                    when: "The replacement can distinguish the requested active tier rather than any historical optimization."
                }
            ]
        }
    ] as const
);
