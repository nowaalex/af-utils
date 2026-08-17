# JavaScriptCore compilation stability

## Problem

Bun exposes DFG compilation and reoptimization counters, but not a public
equivalent of V8's current active-tier intrinsics. Reporting `optimized: true`
from a historical compile count would overstate the evidence.

```ts
// Bad claim: a historical compile does not expose the current attached tier.
const optimizedNow = numberOfDFGCompiles(fn) > 0;
```

## Better practice

Require at least one DFG compilation and reject a retry-count increase during
guarded stress. Report the current tier as `not-observable`.

```ts
const compiledHistorically = numberOfDFGCompiles(fn) > 0;
const stable = retriesAfterStress === retriesBeforeStress;
```

## Implementation

`check.ts` emits `jsc-dfg-not-compiled` and
`jsc-reoptimization-during-stress`. `workers/jsc.ts` reads the official
`bun:jsc` counters in the inspected process. Missing capabilities produce the
separate `jsc-oracle-unsupported` gap.

Pure counter semantics are tested beside the checker. Bun process controls live
in `tests/oracles/runtime-workers.test.ts`.
