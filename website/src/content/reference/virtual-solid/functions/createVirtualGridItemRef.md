---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / createVirtualGridItemRef

# Function: createVirtualGridItemRef()

```ts
function createVirtualGridItemRef(
  rows,
  rowIndex,
  columns,
  columnIndex,
): VirtualElementRef;
```

Create a Solid ref that observes row and column sizes for one grid cell.

## Parameters

| Parameter     | Type                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| `rows`        | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)                  |
| `rowIndex`    | [`MaybeAccessor`](/virtual/reference/virtual-solid/type-aliases/MaybeAccessor)\<`number`\> |
| `columns`     | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)                  |
| `columnIndex` | [`MaybeAccessor`](/virtual/reference/virtual-solid/type-aliases/MaybeAccessor)\<`number`\> |

## Returns

[`VirtualElementRef`](/virtual/reference/virtual-solid/type-aliases/VirtualElementRef)
