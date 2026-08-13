---
title: "Hook: useVirtualLayout()"
description: Connect stable React refs to the framework-neutral virtual layout adapter.
package: "@af-utils/virtual-react"
symbol: useVirtualLayout
kind: hook
referencePath: /virtual/reference/virtual-react/functions/useVirtualLayout
generated: true
---

# useVirtualLayout()

```ts
function useVirtualLayout(model): object;
```

Connect stable React refs to the framework-neutral virtual layout adapter.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Returns

`object`

Refs for the scroller, scroll-size, and rendered-items elements.

### itemsRef

```ts
itemsRef: RefCallback<HTMLElement>;
```

### scrollerRef

```ts
scrollerRef: RefCallback<HTMLElement>;
```

### sizeRef

```ts
sizeRef: RefCallback<HTMLElement>;
```
