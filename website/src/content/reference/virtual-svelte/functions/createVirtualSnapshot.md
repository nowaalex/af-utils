---
title: "Function: createVirtualSnapshot()"
description: Create a readable numeric revision for selected model events.
package: "@af-utils/virtual-svelte"
symbol: createVirtualSnapshot
kind: function
referencePath: /virtual/reference/virtual-svelte/functions/createVirtualSnapshot
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-svelte](/virtual/reference/virtual-svelte/index) / createVirtualSnapshot

# Function: createVirtualSnapshot()

```ts
function createVirtualSnapshot(model, events?): Readable<number>;
```

Create a readable numeric revision for selected model events.

## Parameters

| Parameter | Type                                                                         | Default value                |
| --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined`                  |
| `events`  | `number`                                                                     | `VirtualScrollerEvent.RANGE` |

## Returns

`Readable`\<`number`\>
