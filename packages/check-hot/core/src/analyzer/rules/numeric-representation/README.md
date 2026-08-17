# Numeric representation

## What can go wrong

V8 may optimize arithmetic after seeing only small integers (SMIs). A later
double, `-0`, `NaN`, boundary integer, or overflow can require a different
representation and invalidate that specialization.

```js
export function next(value) {
    return value + 1;
}
```

This is a risk pattern, not automatically bad code. The detector emits
`numeric-operation` only when scope-aware dataflow proves that a public
argument reaches the exact arithmetic site.

Bitwise operators, arithmetic compound assignments, and `++`/`--` are covered
too. A `+`/`+=` chain with a statically proven string or template operand is
ordinary concatenation and is deliberately excluded:

```js
export function expectedMessage(value) {
    return "Expected " + value + ".";
}
```

## How check-hot confirms it

The runtime experiment warms the function with a stable SMI, introduces each
registered numeric variant only after warmup, verifies the result against the
actual mutated arguments, confirms that every variant reached this AST site,
and then asks the engine oracle whether the guarded target stayed optimized.

## Possible remediation

If a measured failure matters, validate or normalize the public numeric domain,
train the intentionally supported representations, or split APIs whose numeric
domains are genuinely different. A complete pass implies no source rewrite.
