---
title: "Function: createVirtualLayout()"
description: Connect Svelte actions to the framework-neutral virtual layout adapter.
package: "@af-utils/virtual-svelte"
symbol: createVirtualLayout
kind: function
referencePath: /virtual/reference/virtual-svelte/functions/createVirtualLayout
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-svelte](/virtual/reference/virtual-svelte/index) / createVirtualLayout

# Function: createVirtualLayout()

```ts
function createVirtualLayout(model, scrollerStyle?): VirtualSvelteLayoutBinding;
```

Connect Svelte actions to the framework-neutral virtual layout adapter.

## Parameters

| Parameter       | Type                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| `model`         | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `scrollerStyle` | `VirtualScrollerLayoutStyle`                                                 |

## Returns

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding)

## Remarks

Call this helper during Svelte component initialization.
