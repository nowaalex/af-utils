---
title: "Function: useVirtualLayout()"
description: Connect stable React refs to the framework-neutral virtual layout adapter.
package: "@af-utils/virtual-react"
symbol: useVirtualLayout
kind: function
referencePath: /virtual/reference/virtual-react/functions/useVirtualLayout
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useVirtualLayout

# Function: useVirtualLayout()

```ts
function useVirtualLayout(model): object;
```

Connect stable React refs to the framework-neutral virtual layout adapter.

## Parameters

| Parameter | Type                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |

## Returns

`object`

Refs for the scroller, scroll-size, and rendered-items elements.

| Name          | Type                           |
| ------------- | ------------------------------ |
| `itemsRef`    | `RefCallback`\<`HTMLElement`\> |
| `scrollerRef` | `RefCallback`\<`HTMLElement`\> |
| `sizeRef`     | `RefCallback`\<`HTMLElement`\> |
