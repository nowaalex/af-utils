---
title: "Hook: useVirtualSnapshot()"
description: Re-render the current component when selected model events are published.
package: "@af-utils/virtual-react"
symbol: useVirtualSnapshot
kind: hook
referencePath: /virtual/reference/virtual-react/functions/useVirtualSnapshot
generated: true
---

# useVirtualSnapshot()

```ts
function useVirtualSnapshot(model, events?): number;
```

Re-render the current component when selected model events are published.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### events?

`number` = `VirtualScrollerEvent.RANGE`

## Returns

`number`

The model revision used as the React external-store snapshot.
