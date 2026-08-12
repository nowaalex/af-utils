---
title: "Function: useVirtualSnapshot()"
description: Reactive revision for selected model events.
package: "@af-utils/virtual-vue"
symbol: useVirtualSnapshot
kind: function
referencePath: /virtual/reference/virtual-vue/functions/useVirtualSnapshot
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-vue](/virtual/reference/virtual-vue/index) / useVirtualSnapshot

# Function: useVirtualSnapshot()

```ts
function useVirtualSnapshot(model, events?): ShallowRef<number>;
```

Reactive revision for selected model events.

## Parameters

| Parameter | Type                                                                         | Default value                |
| --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined`                  |
| `events`  | `number`                                                                     | `VirtualScrollerEvent.RANGE` |

## Returns

`ShallowRef`\<`number`\>
