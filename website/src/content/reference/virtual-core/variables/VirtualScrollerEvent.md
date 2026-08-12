---
title: "Variable: VirtualScrollerEvent"
description: Bit flags accepted by VirtualScroller.subscribe and VirtualScroller.getRevision.
package: "@af-utils/virtual-core"
symbol: VirtualScrollerEvent
kind: variable
referencePath: /virtual/reference/virtual-core/variables/VirtualScrollerEvent
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / VirtualScrollerEvent

# Variable: VirtualScrollerEvent

```ts
const VirtualScrollerEvent: object;
```

Bit flags accepted by [VirtualScroller.subscribe](/virtual/reference/virtual-core/classes/VirtualScroller#subscribe) and
[VirtualScroller.getRevision](/virtual/reference/virtual-core/classes/VirtualScroller#getrevision).

## Type Declaration

| Name                                            | Type |
| ----------------------------------------------- | ---- |
| <a id="property-all"></a> `ALL`                 | `7`  |
| <a id="property-range"></a> `RANGE`             | `1`  |
| <a id="property-scroll_size"></a> `SCROLL_SIZE` | `2`  |
| <a id="property-sizes"></a> `SIZES`             | `4`  |

## Remarks

- `RANGE`: [VirtualScroller.from](/virtual/reference/virtual-core/classes/VirtualScroller#property-from) or [VirtualScroller.to](/virtual/reference/virtual-core/classes/VirtualScroller#property-to) was changed;

- `SCROLL_SIZE`: [VirtualScroller.scrollSize](/virtual/reference/virtual-core/classes/VirtualScroller#property-scrollsize) was changed;

- `SIZES`: at least one cached effective item size was changed.

Flags can be combined without allocating an array:
`VirtualScrollerEvent.RANGE | VirtualScrollerEvent.SIZES`.
