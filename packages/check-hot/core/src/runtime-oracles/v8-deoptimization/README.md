# V8 guarded deoptimization

## Problem

A function can reach Maglev or TurboFan during warmup and then deoptimize when
guarded stress introduces a receiver map, numeric representation, property key,
or callback identity that the optimized code did not cover.

Bad measurement mixes warmup and stress trace lines and reports an unrelated
startup bailout. A sound measurement brackets only guarded stress with compiled
sentinel functions and treats every deoptimization in that interval as a
failure, even if V8 recompiles afterward.

```js
// Risk: warmup sees one receiver map; stress introduces another.
const read = value => value.count;
read({ count: 1 });
read(Object.assign(Object.create(null), { count: 1 }));
```

## Better practice

Warm every intentional representation before optimization, then keep isolated
scenarios for transitions whose cost matters. Do not rewrite code from a static
risk alone; reproduce the measured deoptimization first.

```js
// If both shapes are intentional, include both in warmup and verify both.
for (const value of supportedShapes) read(value);
```

## Implementation

- `check.ts` owns trace boundaries, extraction, target-name filtering, and
  structured problem occurrences.
- `report.ts` owns bounded parsing of V8's textual reason and remediation hints.
- `workers/v8.ts` emits compiled start/end sentinels around stress.
- `runner.ts` supplies `--trace-deopt` and turns occurrences into a failed cell.

V8 trace names are not exact AST identities. Reports explicitly label target
name correlation as non-unique. Node and Deno use this oracle; Bun/JSC does not.

Unit controls live in `check.test.ts`. Real engine controls that distinguish
warmup-only and guarded deopts live in `tests/oracles/runtime-workers.test.ts`.
