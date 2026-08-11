---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useVirtualEffect

# Function: useVirtualEffect()

```ts
function useVirtualEffect(
   model, 
   callback, 
   events?): void;
```

Subscribe to model changes without scheduling a React render.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `model` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined` |
| `callback` | () => `void` | `undefined` |
| `events` | `number` | `VirtualScrollerEvent.ALL` |

## Returns

`void`
