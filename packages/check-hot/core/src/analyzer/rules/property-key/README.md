# Dynamic property keys

> **Change Contract**
>
> - **Responsibility:** detect public dynamic keys at exact keyed-access sites
>   and define key-class experiments.
> - **Boundary:** literal keys and unproven key origins must not become automatic
>   polymorphism claims.
> - **Invariants:** every accepted key variant reaches the same access and passes
>   the argument-aware semantic verifier after warmup.
> - **Configuration owners:** [detector.ts](./detector.ts) and
>   [experiment.ts](./experiment.ts).
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## What can go wrong

```js
export function pick(record, key) {
    return record[key];
}
```

Changing key classes can make the keyed-access inline cache polymorphic or
megamorphic, especially inside a loop. Literal string and numeric keys are not
reported as dynamic.

## How check-hot confirms it

`dynamic-keyed-access` and `dynamic-keyed-access-in-loop` become experiments
only when the key itself is proven to come from a public argument. Accepted
string, index, and symbol variants must each reach the exact access and pass the
args-aware semantic oracle after warmup.

## Possible remediation

For a measured failure, constrain the key domain at the API boundary or split
unrelated lookup modes. Intentional bounded polymorphism is not a defect.
