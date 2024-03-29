<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@af-utils/virtual-react](./virtual-react.md) &gt; [useSubscription](./virtual-react.usesubscription.md)

# useSubscription() function

React hook. Allows to subscribe to [VirtualScrollerEvent](./virtual-core.virtualscrollerevent.md) without unnecessary rerenders.

**Signature:**

```typescript
useSubscription: (model: VirtualScroller, events: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[], callBack: () => void) => void
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  model | [VirtualScroller](./virtual-core.virtualscroller.md) | [VirtualScroller](./virtual-core.virtualscroller.md) instance |
|  events | readonly [VirtualScrollerEvent](./virtual-core.virtualscrollerevent.md)<!-- -->\[\] \| [VirtualScrollerEvent](./virtual-core.virtualscrollerevent.md)<!-- -->\[\] | array of [VirtualScrollerEvent](./virtual-core.virtualscrollerevent.md) to subscribe |
|  callBack | () =&gt; void | callback to be called |

**Returns:**

void

## Remarks

For example can be used in load-on-demand.

