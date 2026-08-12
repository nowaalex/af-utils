---
title: "Function: createVirtual()"
description: Create a component-owned model and synchronize it with an optional store.
package: "@af-utils/virtual-svelte"
symbol: createVirtual
kind: function
referencePath: /virtual/reference/virtual-svelte/functions/createVirtual
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-svelte](/virtual/reference/virtual-svelte/index) / createVirtual

# Function: createVirtual()

```ts
function createVirtual(params): VirtualScroller;
```

Create a component-owned model and synchronize it with an optional store.

## Parameters

| Parameter | Type                                                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`  | [`MaybeReadable`](/virtual/reference/virtual-svelte/type-aliases/MaybeReadable)\<[`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams)\> |

## Returns

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Remarks

Call this helper during Svelte component initialization.
