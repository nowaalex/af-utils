import { defineProblemDefinitions } from "../../problems/definition.js";

/** Problems emitted by the guarded V8 deoptimization oracle. */
export const problemDefinitions = defineProblemDefinitions(
    "v8-deoptimization",
    "src/runtime-oracles/v8-deoptimization/README.md",
    [
        {
            id: "v8-guarded-deoptimization",
            title: "V8 guarded hot-path deoptimization",
            layer: "runtime",
            outcome: "failure",
            evidence: "engine-confirmed",
            likelyCauses: [
                "A new receiver map, key class, callback identity, numeric representation, or field assumption appeared during guarded stress."
            ],
            confirmWith: [
                "Use the isolated scenario timeline and optional V8 IC/Map diagnostics to identify the first destabilizing transition."
            ],
            remediations: [
                {
                    action: "Make construction and accepted input families stable, or include every intentional family during warmup.",
                    when: "The retained trace and scenario semantics confirm the transition is representative rather than engine noise."
                }
            ]
        },
        {
            id: "v8-trace-boundary-missing",
            title: "Missing V8 guarded-stress trace boundary",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "V8 trace flags were unavailable, output was truncated, or the compiled start/end sentinels were not observed."
            ],
            confirmWith: [
                "Inspect raw stdout/stderr, command flags, output cap, and exact runtime/V8 version."
            ],
            remediations: [
                {
                    action: "Restore supported trace flags or increase the bounded output cap and repeat the exact cell.",
                    when: "The missing boundary is a collection failure; never reinterpret missing trace as no deoptimization."
                }
            ]
        }
    ] as const
);
