# Annotation contract

> **Change Contract**
>
> - **Responsibility:** validate that each `check-hot:` marker binds uniquely to
>   the declaration it claims to identify.
> - **Boundary:** comments identify intent; they must not count as runtime
>   evidence or bind across unrelated syntax.
> - **Invariants:** markers are immediate, unique, and reconciled against the
>   exact requested target set before workers execute.
> - **Configuration owners:** [check.ts](./check.ts) owns validation;
>   [problem.ts](./problem.ts) owns the emitted problem definition.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## Problem

A `check-hot:` marker that is detached, duplicated, or attached to a different
function can make a hand-authored suite appear to cover the wrong target.

```js
// Bad: the marker is detached and may be attributed ambiguously.
// check-hot: update
const unrelated = 1;
export function update() {}
```

## Better practice

Bind markers to the immediately following AST declaration and validate the
exact marker/target set before executing workers. Comments are identifiers, not
runtime evidence by themselves.

```js
// check-hot: update
export function update() {}
```

## Implementation

`annotations.ts` owns AST-aware marker binding and validation. `check.ts` turns
each validation error into the stable `annotation-contract-mismatch` problem
shown by the report.
