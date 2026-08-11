---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / VirtualScrollerRuntimeParams

# Interface: VirtualScrollerRuntimeParams

[VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller) parameters that may change over time.
Used as [VirtualScroller.set](/virtual/reference/virtual-core/classes/VirtualScroller#set) argument type.

## Remarks

Implemented as interface for better documentation output (api-extractor)

## Extended by

- [`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams)

## Properties

### estimatedItemSize?

```ts
optional estimatedItemSize?: number;
```

Estimated height/width of scrollable item. Orientation is determined by [VirtualScrollerInitialParams.horizontal](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#horizontal).

#### Remarks

Actual size is always reported by internal `ResizeObserver` when [VirtualScroller.attachItem](/virtual/reference/virtual-core/classes/VirtualScroller#attachitem) is called.
Bad item size assumptions can turn into shaky scrolling experience. Accuracy here is rewarded.

***

### itemCount?

```ts
optional itemCount?: number;
```

Total items quantity

#### Remarks

Maximum supported value is `1_073_741_823` (`2^30 - 1`).
This limit exists, because item sizes cache implementation has bitwise operations, which work only with int32.
The implementation uses a fixed upper capacity so Fenwick tree bitwise traversal stays inside the positive signed 32-bit range.
But there is one more limit. W3C does not provide maximum allowed values for height, width, margin, etc.

CSS theoretically supports infinite precision and infinite ranges for all value types;
however in reality implementations have finite capacity.
UAs should support reasonably useful ranges and precisions

This quote was found [here](https://www.w3.org/TR/css3-values/#numeric-ranges).
Chrome's experimentally found maximum value is `33_554_428`.
So some problems may happen if [VirtualScroller.scrollSize](/virtual/reference/virtual-core/classes/VirtualScroller#scrollsize) is bigger.

***

### overscanCount?

```ts
optional overscanCount?: number;
```

Amount of items rendered before or after visible ones.

#### Remarks

Render place depends on scroll direction:

- if scrolling is done forward - these items are rendered after visible ones;

- If backward - before.
