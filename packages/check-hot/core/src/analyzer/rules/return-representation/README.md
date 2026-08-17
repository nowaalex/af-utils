# Return representation

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
