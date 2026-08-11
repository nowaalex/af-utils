---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useVirtualLayout

# Function: useVirtualLayout()

```ts
function useVirtualLayout(model, scrollerStyle?): object;
```

Connect stable React refs to the framework-neutral virtual layout adapter.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `scrollerStyle` | `CSSProperties` |

## Returns

`object`

Hydration-safe styles and refs for the scroller, scroll-size, and
rendered-items elements.

### itemsRef

```ts
itemsRef: RefCallback<HTMLElement>;
```

### itemsStyle

```ts
itemsStyle: CSSProperties;
```

### scrollerRef

```ts
scrollerRef: RefCallback<HTMLElement>;
```

### scrollerStyle

```ts
scrollerStyle: CSSProperties;
```

### sizeRef

```ts
sizeRef: RefCallback<HTMLElement>;
```

### sizeStyle

```ts
sizeStyle: CSSProperties;
```
