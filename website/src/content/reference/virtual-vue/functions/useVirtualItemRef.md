---
title: "Function: useVirtualItemRef()"
description: Create a Vue template-ref callback that observes one virtual item.
package: "@af-utils/virtual-vue"
symbol: useVirtualItemRef
kind: function
referencePath: /virtual/reference/virtual-vue/functions/useVirtualItemRef
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-vue](/virtual/reference/virtual-vue/index) / useVirtualItemRef

# Function: useVirtualItemRef()

```ts
function useVirtualItemRef(model, index): VirtualVueElementRef;
```

Create a Vue template-ref callback that observes one virtual item.

## Parameters

| Parameter | Type                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `index`   | `MaybeRefOrGetter`\<`number`\>                                               |

## Returns

[`VirtualVueElementRef`](/virtual/reference/virtual-vue/type-aliases/VirtualVueElementRef)
