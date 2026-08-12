---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / mapVirtualRangeWithOffset

# Function: mapVirtualRangeWithOffset()

```ts
function mapVirtualRangeWithOffset<T>(model, callback): T[];
```

Map the current rendered range and provide the pixel offset of every item.

## Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Parameters

| Parameter  | Type                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| `model`    | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `callback` | (`index`, `offset`) => `T`                                                      |

## Returns

`T`[]
