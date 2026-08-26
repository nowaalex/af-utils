# Return representation

> **Change Contract**
>
> - **Responsibility:** identify public functions with materially different
>   static return families for scenario coverage.
> - **Boundary:** mixed syntax kinds must not be reported as a deoptimization or
>   as proof that every return branch was executed.
> - **Invariants:** findings attach to one function owner and remain advisory
>   until isolated and combined scenarios verify behavior.
> - **Configuration owner:** [detector.ts](./detector.ts) owns return-family
>   classification.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## What can go wrong

A function returning several unrelated value classes may force callers to
handle changing representations or dispatch paths.

```js
export function decode(value) {
    if (value === "none") return null;
    if (value === "many") return [];
    return 1;
}
```

## How check-hot confirms it

`mixed-return-kinds` is advisory. It asks the suite author or generated
analyzer to exercise every public return family in isolated and combined modes;
static diversity alone is not a deoptimization.

## Possible remediation

Keep the API when the union is intentional. If caller-side evidence shows a hot
failure, use a stable result envelope or separate APIs with genuinely different
contracts.
