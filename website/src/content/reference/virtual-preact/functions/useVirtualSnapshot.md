---
title: "Function: useVirtualSnapshot()"
description: Re-render the current Preact component when selected model events publish.
package: "@af-utils/virtual-preact"
symbol: useVirtualSnapshot
kind: function
referencePath: /virtual/reference/virtual-preact/functions/useVirtualSnapshot
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-preact](/virtual/reference/virtual-preact/index) / useVirtualSnapshot

# Function: useVirtualSnapshot()

```ts
function useVirtualSnapshot(model, events?): number;
```

Re-render the current Preact component when selected model events publish.

## Parameters

| Parameter | Type                                                                         | Default value                |
| --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined`                  |
| `events`  | `number`                                                                     | `VirtualScrollerEvent.RANGE` |

## Returns

`number`

The selected numeric model revision.
