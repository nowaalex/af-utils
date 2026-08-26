# Property deletion

> **Change Contract**
>
> - **Responsibility:** distinguish object-property deletion from proven local
>   array-index deletion and describe their separate risk classes.
> - **Boundary:** an ambiguous receiver must not be called an array or converted
>   into an automatic destructive experiment.
> - **Invariants:** array-specific findings require a proven local array and all
>   other findings remain conservative and advisory.
> - **Configuration owner:** [detector.ts](./detector.ts) owns receiver
>   classification and finding metadata.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

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
