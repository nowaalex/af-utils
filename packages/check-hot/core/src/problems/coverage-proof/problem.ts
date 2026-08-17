import { defineProblemDefinitions } from "../definition.js";

/** Terminal proof problems represented by coverage-ledger states. */
export const problemDefinitions = defineProblemDefinitions(
    "coverage-proof",
    "src/problems/coverage-proof/README.md",
    [
        {
            id: "coverage-obligation-failed",
            title: "Runtime obligation failed",
            layer: "coverage",
            outcome: "failure",
            evidence: "runtime-measurement",
            likelyCauses: [
                "The selected mutation was reached and semantically verified, but its runtime oracle failed."
            ],
            confirmWith: [
                "Inspect the obligation preflight, exact-site hits, engine event, and isolated reproduction command."
            ],
            remediations: [
                {
                    action: "Change only the confirmed representation/shape/call transition, or declare the engine failure an intentional tested outcome.",
                    when: "The generated variant is valid for the public API and reproduces in isolation."
                }
            ]
        },
        {
            id: "coverage-obligation-blocked",
            title: "Runtime obligation could not be proven",
            layer: "coverage",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "No semantics-aware seed/verifier, exact target identity, or exact-site lifecycle proof was available."
            ],
            confirmWith: [
                "Read the ledger reason and add the missing verifier, target locator, or explicit scenario rather than treating absence as pass."
            ],
            remediations: [
                {
                    action: "Supply a deterministic sample with mutation-aware verification or a hand-authored scenario for the obligation.",
                    when: "The API contract permits a sound experiment for this mutation family."
                }
            ]
        },
        {
            id: "coverage-obligation-unsupported",
            title: "Runtime obligation is unsupported",
            layer: "coverage",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The selected runtime cannot expose the required site, representation, tier, or semantic evidence."
            ],
            confirmWith: [
                "Compare the ledger requirement with the runtime/oracle capability and version in the report."
            ],
            remediations: [
                {
                    action: "Run the obligation on a capable runtime or add a versioned engine adapter with equivalent evidence semantics.",
                    when: "The missing capability can be measured without weakening the proof contract."
                }
            ]
        }
    ] as const
);
