<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@af-utils/virtual-core](./virtual-core.md) &gt; [VirtualScrollerEvent](./virtual-core.virtualscrollerevent.md)

# VirtualScrollerEvent variable

Possible events, supported by [VirtualScroller.on()](./virtual-core.virtualscroller.on.md) method

**Signature:**

```typescript
VirtualScrollerEvent: {
    readonly RANGE: 0;
    readonly SCROLL_SIZE: 1;
    readonly SIZES: 2;
}
```

## Remarks

Events Description:

- `RANGE`<!-- -->: [VirtualScroller.from](./virtual-core.virtualscroller.from.md) or [VirtualScroller.to](./virtual-core.virtualscroller.to.md) was changed;

- `SCROLL_SIZE`<!-- -->: [VirtualScroller.scrollSize](./virtual-core.virtualscroller.scrollsize.md) was changed;

- `SIZES`<!-- -->: at least one item size was changed. [VirtualScroller.sizesHash](./virtual-core.virtualscroller.sizeshash.md)<!-- -->.

