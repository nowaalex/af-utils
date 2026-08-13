---
title: "Hook: useVirtualSnapshot()"
description: Re-render the current Preact component when selected model events publish.
package: "@af-utils/virtual-preact"
symbol: useVirtualSnapshot
kind: hook
referencePath: /virtual/reference/virtual-preact/functions/useVirtualSnapshot
generated: true
---

# useVirtualSnapshot()

```ts
function useVirtualSnapshot(model, events?): number;
```

Re-render the current Preact component when selected model events publish.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### events?

`number` = `VirtualScrollerEvent.RANGE`

## Returns

`number`

The selected numeric model revision.
