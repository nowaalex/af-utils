---
title: "Function: createVirtual()"
description: Create a Solid-owned VirtualScroller and synchronize reactive parameters.
package: "@af-utils/virtual-solid"
symbol: createVirtual
kind: function
referencePath: /virtual/reference/virtual-solid/functions/createVirtual
generated: true
---

# createVirtual()

```ts
function createVirtual(params): VirtualScroller;
```

Create a Solid-owned `VirtualScroller` and synchronize reactive parameters.

## Parameters

### params

[`MaybeAccessor`](/virtual/reference/virtual-solid/type-aliases/MaybeAccessor)\<[`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams)\>

## Returns

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Example

```tsx
const model = createVirtual(() => ({
    itemCount: count(),
    estimatedItemSize: 40
}));
```
