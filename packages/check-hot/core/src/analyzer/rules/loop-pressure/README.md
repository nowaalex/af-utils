# Loop pressure

## What can go wrong

Allocations, `await`, `yield`, and exception regions inside a tight loop may
dominate runtime or GC cost.

```js
for (const value of values) {
    output.push({ value });
}
```

## How check-hot confirms it

`allocation-in-loop` and `control-flow-in-loop` are scenario-selection hints,
not automatic failures. The analyzer counts them in the shared traversal; a
large-input, success/failure, async, exception, or GC-aware scenario supplies
the runtime evidence. Creating an arrow or function expression counts as an
allocation in the owning loop, but its body is a separate function owner and is
not attributed to the outer function's data flow.

## Possible remediation

Reuse storage, move invariant construction out of the loop, batch async work,
or split exceptional paths only when profiling shows that the change matters.
Allocation in a loop is not inherently wrong.
