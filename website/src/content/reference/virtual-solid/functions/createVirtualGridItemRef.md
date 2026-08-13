---
title: "Function: createVirtualGridItemRef()"
description: Create a Solid ref that observes row and column sizes for one grid cell.
package: "@af-utils/virtual-solid"
symbol: createVirtualGridItemRef
kind: function
referencePath: /virtual/reference/virtual-solid/functions/createVirtualGridItemRef
generated: true
---

# createVirtualGridItemRef()

```ts
function createVirtualGridItemRef(
    rows,
    rowIndex,
    columns,
    columnIndex
): VirtualElementRef;
```

Create a Solid ref that observes row and column sizes for one grid cell.

## Parameters

### rows

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### rowIndex

[`MaybeAccessor`](/virtual/reference/virtual-solid/type-aliases/MaybeAccessor)\<`number`\>

### columns

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### columnIndex

[`MaybeAccessor`](/virtual/reference/virtual-solid/type-aliases/MaybeAccessor)\<`number`\>

## Returns

[`VirtualElementRef`](/virtual/reference/virtual-solid/type-aliases/VirtualElementRef)
