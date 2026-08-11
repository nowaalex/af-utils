---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useVirtualSnapshot

# Function: useVirtualSnapshot()

```ts
function useVirtualSnapshot(model, events?): number;
```

Re-render the current component when selected model events are published.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `model` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined` |
| `events` | `number` | `VirtualScrollerEvent.RANGE` |

## Returns

`number`

The model revision used as the React external-store snapshot.
