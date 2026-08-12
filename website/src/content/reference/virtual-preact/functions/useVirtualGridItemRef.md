---
title: "Function: useVirtualGridItemRef()"
description: Observe row and column sizes for one rendered grid cell.
package: "@af-utils/virtual-preact"
symbol: useVirtualGridItemRef
kind: function
referencePath: /virtual/reference/virtual-preact/functions/useVirtualGridItemRef
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-preact](/virtual/reference/virtual-preact/index) / useVirtualGridItemRef

# Function: useVirtualGridItemRef()

```ts
function useVirtualGridItemRef(
    rows,
    rowIndex,
    columns,
    columnIndex
): RefCallback<HTMLElement>;
```

Observe row and column sizes for one rendered grid cell.

## Parameters

| Parameter     | Type                                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| `rows`        | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `rowIndex`    | `number`                                                                     |
| `columns`     | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `columnIndex` | `number`                                                                     |

## Returns

`RefCallback`\<`HTMLElement`\>
