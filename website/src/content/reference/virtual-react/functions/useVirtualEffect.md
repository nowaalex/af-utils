---
title: "Hook: useVirtualEffect()"
description: Subscribe to model changes without scheduling a React render.
package: "@af-utils/virtual-react"
symbol: useVirtualEffect
kind: hook
referencePath: /virtual/reference/virtual-react/functions/useVirtualEffect
generated: true
---

# useVirtualEffect()

```ts
function useVirtualEffect(model, callback, events?): void;
```

Subscribe to model changes without scheduling a React render.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### callback

() => `void`

### events?

`number` = `VirtualScrollerEvent.ALL`

## Returns

`void`
