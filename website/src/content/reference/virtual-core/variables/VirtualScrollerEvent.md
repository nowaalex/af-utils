---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / VirtualScrollerEvent

# Variable: VirtualScrollerEvent

```ts
const VirtualScrollerEvent: object;
```

Bit flags accepted by [VirtualScroller.subscribe](/virtual/reference/virtual-core/classes/VirtualScroller#subscribe) and
[VirtualScroller.getRevision](/virtual/reference/virtual-core/classes/VirtualScroller#getrevision).

## Type Declaration

### ALL

```ts
readonly ALL: 7 = 7;
```

### RANGE

```ts
readonly RANGE: 1 = 1;
```

### SCROLL\_SIZE

```ts
readonly SCROLL_SIZE: 2 = 2;
```

### SIZES

```ts
readonly SIZES: 4 = 4;
```

## Remarks

- `RANGE`: [VirtualScroller.from](/virtual/reference/virtual-core/classes/VirtualScroller#from) or [VirtualScroller.to](/virtual/reference/virtual-core/classes/VirtualScroller#to) was changed;

- `SCROLL_SIZE`: [VirtualScroller.scrollSize](/virtual/reference/virtual-core/classes/VirtualScroller#scrollsize) was changed;

- `SIZES`: at least one measured item size was changed.

Flags can be combined without allocating an array:
`VirtualScrollerEvent.RANGE | VirtualScrollerEvent.SIZES`.
