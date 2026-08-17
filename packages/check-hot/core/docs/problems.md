# Problem model

`check-hot` has one typed problem pipeline:

```text
problemDefinitions[]
        ↓
static detector / runtime oracle / integrity checker
        ↓
HotProblemOccurrence { problemId, message, targetId?, detail? }
        ↓
console report and JSON
```

There is no parallel string-error channel. A run fails because it contains a
structured occurrence, an obligation remains unproven, or the analyzed module
graph is incomplete.

## Where a problem lives

- Static hypotheses live in `src/analyzer/rules/<feature>/`. Each folder owns
  its metadata, Oxc-based detector, nearby tests, mutation experiment when one
  is sound, and a problem-specific README.
- Measured engine failures live in `src/runtime-oracles/<feature>/`. Each folder
  owns its problem IDs, pure checker, nearby tests, and engine-specific proof
  limits. Native calls remain in the worker because they must execute in the
  process that owns the inspected function.
- Proof and integrity gaps live in `src/problems/<feature>/`. They describe why
  check-hot cannot honestly make an optimization claim even when no deopt was
  observed.
- Shared Oxc traversal, binding/dataflow state, process spawning, hashing,
  protocol parsing, and formatting stay shared. Copying those mechanisms into
  every feature would create inconsistent proofs.

The complete machine-readable list is public:

```ts
import { getProblemDefinition, problemDefinitions } from "@af-utils/check-hot";

for (const problem of problemDefinitions) {
    console.log(problem.id, problem.documentation);
}

console.log(getProblemDefinition("v8-guarded-deoptimization"));
```

`src/problems/catalog.test.ts` rejects duplicate IDs and a catalog entry whose
feature README does not exist. Analyzer findings and runtime occurrences use
the same IDs, so reports cannot invent undocumented problem classes.

## Adding a problem

1. Choose the owning layer and create or extend one feature folder.
2. Write the feature README with a minimal bad/risk example, a safer or
   intentionally stable alternative, what the checker actually proves, and
   what it cannot prove.
3. Add the stable definition to that folder's `problem.ts` or detector
   metadata.
4. Implement the pure decision in `check.ts`/`detector.ts`; keep engine I/O and
   shared AST traversal outside it.
5. Add positive, negative, and adversarial tests beside the checker, plus a real
   Node/Deno/Bun control when the claim depends on an engine rather than AST.
6. Register the definition in the relevant catalog. Do not add package-specific
   React, Lodash, date-fns, or Svelte knowledge to core.

Source-map remapping is intentionally postponed. Exact-site obligations in
transformed TS/TSX/JSX remain blocked rather than being guessed from generated
offsets.
