---
title: "Function: useVirtualLayout()"
description: Connect stable Preact refs to the framework-neutral virtual layout adapter.
package: "@af-utils/virtual-preact"
symbol: useVirtualLayout
kind: function
referencePath: /virtual/reference/virtual-preact/functions/useVirtualLayout
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-preact](/virtual/reference/virtual-preact/index) / useVirtualLayout

# Function: useVirtualLayout()

```ts
function useVirtualLayout(model, scrollerStyle?): VirtualPreactLayoutBinding;
```

Connect stable Preact refs to the framework-neutral virtual layout adapter.

## Parameters

| Parameter       | Type                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| `model`         | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `scrollerStyle` | `CSSProperties`                                                              |

## Returns

[`VirtualPreactLayoutBinding`](/virtual/reference/virtual-preact/interfaces/VirtualPreactLayoutBinding)

Hydration-safe styles and refs for all virtual layout elements.
