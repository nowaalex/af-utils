---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / VirtualLayoutBinding

# Interface: VirtualLayoutBinding

DOM refs and hydration-safe styles produced by `createVirtualLayout`.

## Properties

### itemsRef

```ts
itemsRef: VirtualElementRef;
```

Attach the absolutely positioned rendered-range container.

***

### itemsStyle

```ts
itemsStyle: string;
```

Serialized initial rendered-items geometry style.

***

### scrollerRef

```ts
scrollerRef: VirtualElementRef;
```

Attach the native element scroller.

***

### scrollerStyle

```ts
scrollerStyle: string;
```

Serialized initial scroller style for Solid SSR and hydration.

***

### sizeRef

```ts
sizeRef: VirtualElementRef;
```

Attach the element contributing native scroll extent.

***

### sizeStyle

```ts
sizeStyle: string;
```

Serialized initial native scroll-size style.
