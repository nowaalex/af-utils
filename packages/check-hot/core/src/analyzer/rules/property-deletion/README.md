# Property deletion

## What can go wrong

`delete object.field` can move an object toward dictionary storage, while
deleting an array index creates a hole. Both can invalidate optimized
assumptions, but they are different experiments and remediations.

```js
export function clear(record) {
    delete record.value;
}
```

## How check-hot confirms it

The detector proves an array-specific finding only for a locally created array;
otherwise it reports the conservative object-shape risk. These findings remain
advisory until a scenario can observe the exact affected value safely.

## Possible remediation

For a confirmed hot-path issue, preserve a stable object layout (sometimes by
assigning `undefined`) or use a data structure whose deletion semantics match
the workload. Preserve observable property-presence behavior when choosing a
replacement.

```js
// Only equivalent when property presence is not observable by the API.
export function clear(record) {
    record.value = undefined;
}
```
