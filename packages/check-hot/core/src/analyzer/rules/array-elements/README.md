# Local array elements

> **Change Contract**
>
> - **Responsibility:** detect local array operations that may change elements
>   representation and define safe runtime mutation families.
> - **Boundary:** the rule must not merge unrelated receivers or claim a fixed
>   engine threshold for holes, density, or dictionary storage.
> - **Invariants:** findings retain exact local receivers and automatic
>   experiments preserve the accepted semantic domain.
> - **Configuration owners:** [detector.ts](./detector.ts) owns static facts;
>   [experiment.ts](./experiment.ts) owns runtime mutations.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## What can go wrong

Holes, far-index writes, or unrelated pushed value classes can generalize an
array's elements representation.

```js
const values = [];
values.push(1);
values.push({ value: 2 });
delete values[0];
values[1000] = 3;
```

The detector tracks exact local receivers. Pushes to two different arrays are
not merged, and a heterogeneous literal is described as generalized at
creation rather than as a later transition. Unknown literal elements do not
hide heterogeneity when at least two other elements have provably different
classes. A far-index warning does not claim a fixed dictionary-mode boundary:
the actual transition depends on the runtime, current length, capacity, and
density.

## How check-hot confirms it

These local-source findings are advisory unless public dataflow and an exact
runtime owner make a safe experiment possible. Public numeric indexing is
handled separately by `parameter-receiver`.

## Possible remediation

For a measured problem, avoid accidental holes and far writes, or keep each hot
array's element domain consistent. Heterogeneous data may be the correct model;
do not rewrite it solely because the detector found it.
