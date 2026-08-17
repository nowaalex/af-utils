import { defineProblemDefinitions } from "../../problems/definition.js";

/** Process-level problems that prevent an engine result from being trusted. */
export const problemDefinitions = defineProblemDefinitions(
    "worker-liveness",
    "src/runtime-oracles/worker-liveness/README.md",
    [
        {
            id: "runtime-worker-timeout",
            title: "Runtime worker timed out",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "A synchronous loop, deadlock, blocked external resource, or unrealistic iteration budget exceeded the wall-clock limit."
            ],
            confirmWith: [
                "Run the reproduction command with one isolated scenario and inspect the last lifecycle event before timeout."
            ],
            remediations: [
                {
                    action: "Fix the blocking workload or set a justified per-worker timeout after measuring expected setup/warmup duration.",
                    when: "The scenario is deterministic and the larger budget will not hide an infinite loop."
                }
            ]
        },
        {
            id: "runtime-worker-result-missing",
            title: "Runtime worker result is missing",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The process crashed, output was truncated, or worker protocol output was never emitted."
            ],
            confirmWith: [
                "Inspect exit status, signal, stdout/stderr, output cap, and the exact worker command."
            ],
            remediations: [
                {
                    action: "Resolve the preceding crash/protocol/output failure and repeat the cell.",
                    when: "A structured terminal result can be restored; absence must never count as pass."
                }
            ]
        },
        {
            id: "runtime-worker-result-invalid",
            title: "Runtime worker result is invalid",
            layer: "integrity",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The worker emitted malformed, duplicated, stale, or request-inconsistent protocol output."
            ],
            confirmWith: [
                "Inspect every retained protocol record and compare its version, request identity, runtime, tier, mode, purpose, scenarios, and coverage with the worker command."
            ],
            remediations: [
                {
                    action: "Fix the worker or suite protocol corruption and repeat the matrix cell.",
                    when: "Exactly one schema-valid result can be bound to the current worker request."
                }
            ]
        },
        {
            id: "runtime-worker-cleanup-failure",
            title: "Runtime worker process tree was not cleaned up",
            layer: "infrastructure",
            outcome: "gap",
            evidence: "proof-gap",
            likelyCauses: [
                "The operating system rejected process-tree termination, the platform cleanup command failed, or worker-owned streams remained open past the cleanup deadline."
            ],
            confirmWith: [
                "Inspect the timeout or output-overflow error together with the retained cleanup failure and verify whether worker descendants still exist."
            ],
            remediations: [
                {
                    action: "Repair platform process-tree termination before repeating the workload.",
                    when: "The runtime can guarantee bounded cleanup for the complete worker tree."
                }
            ]
        },
        {
            id: "runtime-worker-exit-failure",
            title: "Runtime worker exited unsuccessfully",
            layer: "infrastructure",
            outcome: "failure",
            evidence: "runtime-measurement",
            likelyCauses: [
                "Suite setup, scenario code, assertions, runtime loading, or engine flags caused a non-zero exit."
            ],
            confirmWith: [
                "Use the retained stderr and reproduction command to identify the first thrown problem before interpreting JIT evidence."
            ],
            remediations: [
                {
                    action: "Fix the suite/runtime failure or narrow it to an intentional semantic assertion.",
                    when: "The failing command and exact runtime reproduce the same non-zero exit."
                }
            ]
        },
        {
            id: "runtime-worker-execution-failure",
            title: "Runtime worker execution failed",
            layer: "infrastructure",
            outcome: "failure",
            evidence: "runtime-measurement",
            likelyCauses: [
                "The executable was missing, could not spawn, lacked permissions, or process I/O failed."
            ],
            confirmWith: [
                "Inspect the spawn error code, executable path, permissions, and runtime environment outside target code."
            ],
            remediations: [
                {
                    action: "Install/configure the requested executable or repair process permissions/resources.",
                    when: "The failure occurs before a trustworthy worker result and is not a target-code diagnosis."
                }
            ]
        }
    ] as const
);
