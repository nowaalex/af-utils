---
title: "Function: useVirtualEffect()"
description: Subscribe to model changes without scheduling a Preact render.
package: "@af-utils/virtual-preact"
symbol: useVirtualEffect
kind: function
referencePath: /virtual/reference/virtual-preact/functions/useVirtualEffect
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-preact](/virtual/reference/virtual-preact/index) / useVirtualEffect

# Function: useVirtualEffect()

```ts
function useVirtualEffect(model, callback, events?): void;
```

Subscribe to model changes without scheduling a Preact render.

## Parameters

| Parameter  | Type                                                                         | Default value              |
| ---------- | ---------------------------------------------------------------------------- | -------------------------- |
| `model`    | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined`                |
| `callback` | () => `void`                                                                 | `undefined`                |
| `events`   | `number`                                                                     | `VirtualScrollerEvent.ALL` |

## Returns

`void`
