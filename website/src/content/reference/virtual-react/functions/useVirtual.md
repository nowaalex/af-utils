---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useVirtual

# Function: useVirtual()

```ts
function useVirtual(params): VirtualScroller;
```

React hook.
Calls [useVirtualModel](/virtual/reference/virtual-react/functions/useVirtualModel) and synchronizes it with props

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams) |

## Returns

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Remarks

`VirtualScroller.set()` is called internally to synchronize the model with props.

## Example

```tsx
useVirtual({
    itemCount: 1000,
    estimatedItemSize: 100,
    overscanCount: 1
});
```
