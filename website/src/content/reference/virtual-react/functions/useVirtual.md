---
title: "Hook: useVirtual()"
description: React hook. Calls useVirtualModel and synchronizes it with props
package: "@af-utils/virtual-react"
symbol: useVirtual
kind: hook
referencePath: /virtual/reference/virtual-react/functions/useVirtual
generated: true
---

# useVirtual()

```ts
function useVirtual(params): VirtualScroller;
```

React hook.
Calls [useVirtualModel](/virtual/reference/virtual-react/functions/useVirtualModel) and synchronizes it with props

## Parameters

### params

[`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams)

## Returns

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Remarks

`VirtualScroller.set()` is called internally to synchronize the model with props.

## Example

```tsx
useVirtual({
    itemCount: 1000,
    estimatedItemSize: 100,
    overscanCount: 1
});
```
