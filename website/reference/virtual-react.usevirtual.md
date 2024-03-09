<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@af-utils/virtual-react](./virtual-react.md) &gt; [useVirtual](./virtual-react.usevirtual.md)

# useVirtual() function

React hook. Calls [useVirtualModel()](./virtual-react.usevirtualmodel.md) and synchronizes it with props

**Signature:**

```typescript
useVirtual: (params: VirtualScrollerInitialParams) => VirtualScroller
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  params | [VirtualScrollerInitialParams](./virtual-core.virtualscrollerinitialparams.md) |  |

**Returns:**

[VirtualScroller](./virtual-core.virtualscroller.md)

## Remarks

[VirtualScroller.set()](./virtual-core.virtualscroller.set.md) is called internally to syncchronize model with props.

## Example


```tsx
useVirtual({
    itemCount: 1000,
    estimatedItemSize: 100,
    overscanCount: 1
});
```
