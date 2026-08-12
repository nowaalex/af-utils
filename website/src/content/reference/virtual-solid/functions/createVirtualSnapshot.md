---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / createVirtualSnapshot

# Function: createVirtualSnapshot()

```ts
function createVirtualSnapshot(model, events?): Accessor<number>;
```

Create a Solid accessor updated by selected model events.

## Parameters

| Parameter | Type                                                                         | Default value                |
| --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined`                  |
| `events`  | `number`                                                                     | `VirtualScrollerEvent.RANGE` |

## Returns

`Accessor`\<`number`\>

Accessor containing the current selected model revision.
