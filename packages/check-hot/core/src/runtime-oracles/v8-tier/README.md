# V8 active tier

> **Change Contract**
>
> - **Responsibility:** verify the requested currently attached V8 optimization
>   tier after guarded stress.
> - **Boundary:** a generic optimized-status bit must not be promoted to Maglev
>   or TurboFan evidence.
> - **Invariants:** the requested tier is explicit, checked after stress, and any
>   other optimized state remains `other-optimized`.
> - **Configuration owners:** [check.ts](./check.ts) owns evaluation;
>   [problem.ts](./problem.ts) owns failures.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## Problem

`%GetOptimizationStatus` can report some optimized code without proving that the
requested Maglev or TurboFan tier is currently attached. Treating any optimized
bit as success can hide tier fallback or deoptimization.

```ts
// Wrong oracle: an arbitrary optimized bit is not proof of TurboFan.
const passed = Boolean(status & OPTIMIZED_BIT);
```

## Better practice

Ask for one explicit tier and verify it after guarded stress with the active-tier
intrinsics. Report `other-optimized` honestly instead of promoting it to the
requested tier.

```ts
const passed = requested === "turbofan" && activeTier === "turbofan";
```

## Implementation

`check.ts` classifies independent status, Maglev, and TurboFan observations and
emits `v8-tier-mismatch`. `workers/v8.ts` owns the native intrinsic calls because
they must execute inside the inspected V8 process. An unavailable intrinsic is
reported separately as `v8-tier-oracle-unsupported`.

Pure classification tests live beside the checker. Real Node/Deno controls live
in `tests/oracles/runtime-workers.test.ts`.
