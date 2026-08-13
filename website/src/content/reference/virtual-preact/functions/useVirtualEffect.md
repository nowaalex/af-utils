---
title: "Hook: useVirtualEffect()"
description: Subscribe to model changes without scheduling a Preact render.
package: "@af-utils/virtual-preact"
symbol: useVirtualEffect
kind: hook
referencePath: /virtual/reference/virtual-preact/functions/useVirtualEffect
generated: true
---

# useVirtualEffect()

```ts
function useVirtualEffect(model, callback, events?): void;
```

Subscribe to model changes without scheduling a Preact render.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### callback

() => `void`

### events?

`number` = `VirtualScrollerEvent.ALL`

## Returns

`void`
