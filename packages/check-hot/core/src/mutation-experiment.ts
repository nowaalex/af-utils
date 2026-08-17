/** Deterministic family-specific input transition used after stable warmup. */
export interface HotMutationExperiment {
    /** Exact ordered variant IDs required by the coverage ledger. */
    variants: readonly string[];
    /** Construct one semantically testable value from a safe seed. */
    mutate: (value: unknown, iteration: number) => unknown;
}
