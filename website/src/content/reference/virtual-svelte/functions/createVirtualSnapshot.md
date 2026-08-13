---
title: "Function: createVirtualSnapshot()"
description: Create a readable numeric revision for selected model events.
package: "@af-utils/virtual-svelte"
symbol: createVirtualSnapshot
kind: function
referencePath: /virtual/reference/virtual-svelte/functions/createVirtualSnapshot
generated: true
---

# createVirtualSnapshot()

```ts
function createVirtualSnapshot(model, events?): Readable<number>;
```

Create a readable numeric revision for selected model events.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### events?

`number` = `VirtualScrollerEvent.RANGE`

## Returns

`Readable`\<`number`\>
