---
title: "Function: mapVirtualRange()"
description: Map the current rendered range without first allocating an indexes array.
package: "@af-utils/virtual-core"
symbol: mapVirtualRange
kind: function
referencePath: /virtual/reference/virtual-core/functions/mapVirtualRange
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / mapVirtualRange

# Function: mapVirtualRange()

```ts
function mapVirtualRange<T>(model, callback): T[];
```

Map the current rendered range without first allocating an indexes array.

## Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Parameters

| Parameter  | Type                                                                         |
| ---------- | ---------------------------------------------------------------------------- |
| `model`    | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `callback` | (`index`) => `T`                                                             |

## Returns

`T`[]
