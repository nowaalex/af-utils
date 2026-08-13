---
title: "Function: createVirtualSnapshot()"
description: Create a Solid accessor updated by selected model events.
package: "@af-utils/virtual-solid"
symbol: createVirtualSnapshot
kind: function
referencePath: /virtual/reference/virtual-solid/functions/createVirtualSnapshot
generated: true
---

# createVirtualSnapshot()

```ts
function createVirtualSnapshot(model, events?): Accessor<number>;
```

Create a Solid accessor updated by selected model events.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### events?

`number` = `VirtualScrollerEvent.RANGE`

## Returns

`Accessor`\<`number`\>

Accessor containing the current selected model revision.
