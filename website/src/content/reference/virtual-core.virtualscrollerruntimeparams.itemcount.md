---
slug: virtual-core.virtualscrollerruntimeparams.itemcount 
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Reference home](/virtual/reference/index) &gt; [@af-utils/virtual-core](/virtual/reference/virtual-core) &gt; [VirtualScrollerRuntimeParams](/virtual/reference/virtual-core.virtualscrollerruntimeparams) &gt; [itemCount](/virtual/reference/virtual-core.virtualscrollerruntimeparams.itemcount)

# VirtualScrollerRuntimeParams.itemCount property

Total items quantity

**Signature:**

```typescript
itemCount?: number;
```

## Remarks

Maximum suported value is `2_147_483_647` (int32 max). This limit exists, because item sizes cache implementation has bitwise operations, which work only with int32. But there is one more limit. W3C does not provide maximum allowed values for height, width, margin, etc.

CSS theoretically supports infinite precision and infinite ranges for all value types; however in reality implementations have finite capacity. UAs should support reasonably useful ranges and precisions

This quote was found [here](https://www.w3.org/TR/css3-values/#numeric-ranges)<!-- -->. Chrome's experimentally found maximum value is `33_554_428`<!-- -->. So some problems may happen if [VirtualScroller.scrollSize](/virtual/reference/virtual-core.virtualscroller.scrollsize) is bigger.
