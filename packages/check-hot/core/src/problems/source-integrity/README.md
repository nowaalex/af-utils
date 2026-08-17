# Source identity and runtime resolution

## Problem

A result is stale if the runtime imports a different artifact from the one Oxc
analyzed, or if an analyzed/probed source file changes before measurement. A
passing optimizer result for the wrong bytes is a false pass.

```text
analyzed: package/dist/import.js
executed: package/dist/require.cjs  <- result must be rejected
```

## Better practice

Authenticate the public runtime entry, every parsed source file, adapter graph,
and resolver-sensitive package tree before importing target code. Regenerate the
suite after any mismatch.

```text
public specifier + runtime conditions + package-relative artifact + SHA-256
must all match before target import
```

## Implementation

`check.ts` creates the feature's two typed failures. The shared
`problems/error.ts` transport preserves their stable IDs through generic worker
catches. Hashing and native resolution remain in `source-identity`,
`module-suite`, and `worker-shared`; they invoke this checker at the exact point
where the proof becomes invalid.

Negative controls mutate internal files, package trees, and selected artifacts
after generation and require a non-pass result.
