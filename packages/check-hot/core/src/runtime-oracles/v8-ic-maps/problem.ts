import { defineProblemDefinitions } from "../../problems/definition.js";

/** Non-gating gaps emitted by the optional V8 IC/Map diagnostic rerun. */
export const problemDefinitions = defineProblemDefinitions(
    "v8-ic-maps",
    "src/runtime-oracles/v8-ic-maps/README.md",
    [
        {
            id: "v8-ic-map-diagnostic-gap",
            title: "V8 IC/Map diagnostic evidence is incomplete",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The diagnostic worker failed, target identity was unavailable, the V8 log format changed, or the bounded log was too large to parse."
            ],
            confirmWith: [
                "Inspect the separate diagnostic command/status, exact V8 version, raw log artifact, and target-name correlation scope."
            ],
            remediations: [
                {
                    action: "Restore a successful version-matched diagnostic worker or update the parser/control for the retained V8 log format.",
                    when: "The deeper graph is needed to explain a primary result; never promote the missing diagnostic to target failure."
                }
            ]
        },
        {
            id: "v8-inline-cache-polymorphism-observed",
            title: "V8 inline cache became polymorphic",
            layer: "runtime",
            outcome: "risk",
            evidence: "runtime-measurement",
            likelyCauses: [
                "The same access site observed multiple receiver Maps or key families during the isolated diagnostic stress workload."
            ],
            confirmWith: [
                "Inspect the authenticated source-owner or unique requested-name code range, accessed key, 1→P/P transition, and connected observed Maps in the retained log."
            ],
            remediations: [
                {
                    action: "If the variants are accidental, stabilize object construction or separate genuinely different shapes before this hot access.",
                    when: "Only after the representative workload confirms the extra receiver/key families are unintended; polymorphism can be valid code."
                }
            ]
        },
        {
            id: "v8-inline-cache-megamorphism-observed",
            title: "V8 inline cache became megamorphic",
            layer: "runtime",
            outcome: "risk",
            evidence: "runtime-measurement",
            likelyCauses: [
                "The isolated target access site exceeded V8's polymorphic cache capacity for the observed receiver Maps or keys."
            ],
            confirmWith: [
                "Inspect the authenticated source-owner or unique requested-name code range, accessed key, P→N/N transition, and the exact diagnostic scenario matrix."
            ],
            remediations: [
                {
                    action: "Reduce unintended shape/key diversity or split dispatch paths when the same representative site repeatedly reaches N state.",
                    when: "Only for a measured hot site whose workload is contract-valid; do not redesign code solely because one advisory rerun reached N."
                }
            ]
        }
    ] as const
);
