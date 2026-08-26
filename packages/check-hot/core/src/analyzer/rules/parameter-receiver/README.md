# Public parameter as a receiver

> **Change Contract**
>
> - **Responsibility:** classify object-shape and array-elements operations on a
>   receiver proven to come from a public parameter.
> - **Boundary:** ambiguous computed access or `length` reads must not be
>   promoted to array or object-shape mutations without separate proof.
> - **Invariants:** receiver role, operation kind, and parameter origin remain
>   exact at the reported site.
> - **Configuration owner:** [detector.ts](./detector.ts) owns classification and
>   automation eligibility.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## What can go wrong

Named reads such as `point.x` depend on object shape; proven numeric indexing
and known array methods depend on elements kind and packedness.

```js
export const readPoint = point => point.x;
export const first = values => values[0];
```

The detector deliberately does not call every computed access an array. A
dynamic `record[key]` is advisory until the receiver or key role is separately
proven; a static `record["field"]` remains object-shape evidence.
`value.length` is even more ambiguous: strings, arrays, typed arrays, functions,
and ordinary records may all expose it. It remains an advisory finding without
an automatic object-shape or array-elements mutation until another operation
proves the receiver role.

## How check-hot confirms it

An automatic obligation exists only when the receiver is traced to a public
argument. The corresponding object-shape or array-elements experiment must
preserve semantics and hit this exact member expression after warmup.

## Possible remediation

For a confirmed shape failure, create records consistently and initialize class
fields in one order. For a confirmed elements failure, avoid accidental holes
or split pipelines with unrelated element domains. Do nothing when the measured
polymorphism is intentional and stable.
