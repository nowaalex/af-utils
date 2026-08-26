# Callback identity

> **Change Contract**
>
> - **Responsibility:** identify callback-bearing sites where changing function
>   identities can alter dispatch behavior.
> - **Boundary:** the rule must not treat an inner closure's execution as proof
>   for its exported parent or mutate callbacks without a semantic verifier.
> - **Invariants:** findings retain the exact owning function and callback site;
>   mutation families remain stable, polymorphic, or megamorphic by design.
> - **Configuration owners:** [detector.ts](./detector.ts) and
>   [experiment.ts](./experiment.ts).
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## What can go wrong

```js
export function apply(values, callback) {
    return values.map(callback);
}
```

A call site trained with one function identity can behave differently when it
later sees several unrelated closures. The detector covers direct callback
calls and arguments passed to known collection methods.

## How check-hot confirms it

The core introduces stable, polymorphic, and megamorphic callback families
after warmup. The exact owning function is part of the evidence: executing an
inner closure does not prove that checking only its exported parent covered the
inner call site.

## Possible remediation

For a confirmed failure, keep a bounded callback set at the hot call site,
train the set the application really uses, or move highly variable dispatch out
of the tight loop. Do not cache closures merely to silence a static finding.
