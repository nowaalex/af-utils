# Local array elements

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
