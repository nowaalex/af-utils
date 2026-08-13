---
title: "Hook: useScroller()"
description: React hook. Synchronizes scroller with model.
package: "@af-utils/virtual-react"
symbol: useScroller
kind: hook
referencePath: /virtual/reference/virtual-react/functions/useScroller
generated: true
---

# useScroller()

```ts
function useScroller(model, scroller): void;
```

React hook.
Synchronizes scroller with model.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

### scroller

\| [`VirtualScrollerScrollElement`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerScrollElement)
\| `null`

## Returns

`void`

## Remarks

Should be used in window-scroll cases, otherwise `ref={el => model.setScroller( el )}` is preferrable.
