---
title: "Function: useVirtualModel()"
description: React hook. Creates and stores exactly one VirtualScroller instance. It is not recreated during component lifecycle.
package: "@af-utils/virtual-react"
symbol: useVirtualModel
kind: function
referencePath: /virtual/reference/virtual-react/functions/useVirtualModel
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useVirtualModel

# Function: useVirtualModel()

```ts
function useVirtualModel(params): VirtualScroller;
```

React hook.
Creates and stores exactly one `VirtualScroller` instance.
It is not recreated during component lifecycle.

## Parameters

| Parameter | Type                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `params`  | [`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams) |

## Returns

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Remarks

Normally [useVirtual](/virtual/reference/virtual-react/functions/useVirtual) should be used.
