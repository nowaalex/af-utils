import { defineProblemDefinitions } from "../../problems/definition.js";

/** Problems emitted by Bun's public JavaScriptCore counters. */
export const problemDefinitions = defineProblemDefinitions(
    "jsc-compilation",
    "src/runtime-oracles/jsc-compilation/README.md",
    [
        {
            id: "jsc-dfg-not-compiled",
            title: "JavaScriptCore did not compile the target with DFG",
            layer: "runtime",
            outcome: "failure",
            evidence: "engine-confirmed",
            likelyCauses: [
                "The target stayed cold, did not meet DFG thresholds, or contains constructs this JSC build did not optimize."
            ],
            confirmWith: [
                "Compare DFG compile count, invocation count, compile time, and optional sampling distribution in the isolated cell."
            ],
            remediations: [
                {
                    action: "Make warmup representative or simplify only the construct confirmed to prevent DFG compilation.",
                    when: "The production workload is actually hot and repeated isolated runs show the same zero DFG count."
                }
            ]
        },
        {
            id: "jsc-reoptimization-during-stress",
            title: "JavaScriptCore retried optimization during stress",
            layer: "runtime",
            outcome: "failure",
            evidence: "engine-confirmed",
            likelyCauses: [
                "Stress introduced a representation, call target, or control-flow state that triggered a delayed reoptimization attempt."
            ],
            confirmWith: [
                "Compare the before/after retry delta and isolate the first scenario family while retaining DFG count evidence."
            ],
            remediations: [
                {
                    action: "Stabilize the confirmed input family or train every intentional family before the optimized phase.",
                    when: "The retry delta consistently belongs to a valid stress input rather than sampling/profiler perturbation."
                }
            ]
        },
        {
            id: "jsc-oracle-unsupported",
            title: "Bun JavaScriptCore oracle is unavailable",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The Bun build lacks a required bun:jsc function or changed its public diagnostic API."
            ],
            confirmWith: [
                "Inspect the missing capability name and exact Bun/JSC version before interpreting target code."
            ],
            remediations: [
                {
                    action: "Use a supported Bun build or add a feature-detected oracle adapter for the new public API.",
                    when: "Equivalent evidence semantics can be preserved; never replace it with a guessed current tier."
                }
            ]
        }
    ] as const
);
