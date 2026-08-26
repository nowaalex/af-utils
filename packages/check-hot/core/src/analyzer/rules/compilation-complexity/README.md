# Compilation complexity

> **Change Contract**
>
> - **Responsibility:** rank large or branch-heavy functions for scenario and
>   coverage attention.
> - **Boundary:** size and branch counts must not become optimizer failures or
>   claims about a runtime's compilation budget.
> - **Invariants:** complexity remains advisory and attaches to one exact
>   function owner.
> - **Configuration owner:** [detector.ts](./detector.ts) owns the measured
>   syntax features and reporting threshold.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## What can go wrong

Large, branch-heavy functions are harder to cover by scenarios and may encounter
inlining or compilation-budget limits.

```js
// Risk: unrelated branch families share one compilation unit.
export function process(value, mode) {
    if (mode === "parse") return parse(value);
    if (mode === "render") return render(value);
    if (mode === "persist") return persist(value);
}
```

## How check-hot confirms it

`large-complex-function` is only a ranking and coverage hint. Reports should
split major branch families and inspect tiering/compilation evidence; line count
alone never fails a suite.

## Possible remediation

Refactor only when profiling or engine evidence points at compilation pressure.
A cohesive large function that optimizes correctly is valid code.

```js
const operations = { parse, render, persist };
export const process = (value, mode) => operations[mode](value);
```
