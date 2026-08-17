# Dynamic code

## What can go wrong

```js
export function evaluate(source) {
    return eval(source);
}
```

Unshadowed direct `eval` can inspect or change local bindings. That makes local
dataflow incomplete and can limit optimization. A parameter or local function
named `eval` is not treated as the global intrinsic.

## How check-hot confirms it

`dynamic-eval` is advisory. More importantly, the presence of direct `eval` is
an automation barrier: check-hot will not claim that a public argument still
reaches a later operation when evaluated code could have overwritten it.

## Possible remediation

Move parsing or dynamic dispatch outside the hot function, replace string code
with explicit functions, or provide a hand-written scenario when removal is not
possible. Static analysis alone never marks this risk as fixed.
