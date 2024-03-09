<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@af-utils/virtual-react](./virtual-react.md) &gt; [useScroller](./virtual-react.usescroller.md)

# useScroller() function

React hook. Synchronizes scroller with model.

**Signature:**

```typescript
useScroller: (model: VirtualScroller, scroller: VirtualScrollerScrollElement | null) => void
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  model | [VirtualScroller](./virtual-core.virtualscroller.md) |  |
|  scroller | [VirtualScrollerScrollElement](./virtual-core.virtualscrollerscrollelement.md) \| null |  |

**Returns:**

void

## Remarks

Should be used in window-scroll cases, otherwise `ref={el => model.setScroller( el )}` is preferrable.
