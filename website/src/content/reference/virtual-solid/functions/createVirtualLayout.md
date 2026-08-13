---
title: "Function: createVirtualLayout()"
description: Connect Solid refs to the framework-neutral virtual DOM layout adapter.
package: "@af-utils/virtual-solid"
symbol: createVirtualLayout
kind: function
referencePath: /virtual/reference/virtual-solid/functions/createVirtualLayout
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / createVirtualLayout

# Function: createVirtualLayout()

```ts
function createVirtualLayout(model): VirtualLayoutBinding;
```

Connect Solid refs to the framework-neutral virtual DOM layout adapter.

## Parameters

| Parameter | Type                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |

## Returns

[`VirtualLayoutBinding`](/virtual/reference/virtual-solid/interfaces/VirtualLayoutBinding)

Refs for the scroller, scroll-size, and rendered-items elements.
