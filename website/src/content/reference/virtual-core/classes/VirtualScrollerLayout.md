---
title: "Class: VirtualScrollerLayout"
description: Framework-neutral DOM layout adapter for VirtualScroller.
package: "@af-utils/virtual-core"
symbol: VirtualScrollerLayout
kind: class
referencePath: /virtual/reference/virtual-core/classes/VirtualScrollerLayout
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / VirtualScrollerLayout

# Class: VirtualScrollerLayout

Framework-neutral DOM layout adapter for [VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller).

## Remarks

It keeps the scroll-size element and rendered-items element synchronized
without scheduling framework renders. React and Solid adapters can expose
this class through their native ref primitives.

## Constructors

### Constructor

```ts
new VirtualScrollerLayout(model): VirtualScrollerLayout;
```

Create a DOM layout adapter for one model.

#### Parameters

| Parameter | Type                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |

#### Returns

`VirtualScrollerLayout`

## Methods

### dispose()

```ts
dispose(): void;
```

Disconnect every element and event listener owned by this adapter.

#### Returns

`void`

---

### getItemsElementStyle()

```ts
getItemsElementStyle(): VirtualScrollerLayoutStyle;
```

Return the complete current style for the rendered item range.

#### Returns

[`VirtualScrollerLayoutStyle`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerLayoutStyle)

#### Remarks

The snapshot is DOM-independent, so it is safe to use for both
server markup and the first client render. Later model events are still
synchronized directly by this adapter without framework rerenders.

---

### getScrollerElementStyle()

```ts
getScrollerElementStyle(interactiveStyle): VirtualScrollerLayoutStyle;
```

Return a hydration-safe style for the scroll container.

#### Parameters

| Parameter          | Type                                                                                                    | Description                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `interactiveStyle` | [`VirtualScrollerLayoutStyle`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerLayoutStyle) | Style to expose after the model owns the DOM element. Before attachment, scrolling is disabled while every other declaration is preserved. |

#### Returns

[`VirtualScrollerLayoutStyle`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerLayoutStyle)

---

### getSizeElementStyle()

```ts
getSizeElementStyle(): VirtualScrollerLayoutStyle;
```

Return the complete current style for the native scroll-size element.

#### Returns

[`VirtualScrollerLayoutStyle`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerLayoutStyle)

#### Remarks

Framework adapters should serialize this snapshot during server
rendering. Applying the scroll geometry only from a client ref changes
the native scrollbar track during hydration and can invalidate a thumb
drag that started against the server-rendered page.

---

### setItemsElement()

```ts
setItemsElement(element): void;
```

Connect or disconnect the element containing currently rendered items.

#### Parameters

| Parameter | Type                    |
| --------- | ----------------------- |
| `element` | `HTMLElement` \| `null` |

#### Returns

`void`

---

### setScrollerElement()

```ts
setScrollerElement(element, interactiveStyle): void;
```

Attach or detach the scroll container and expose native scrolling only
after the model listeners are installed.

#### Parameters

| Parameter          | Type                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `element`          | `HTMLElement` \| `null`                                                                                 |
| `interactiveStyle` | [`VirtualScrollerLayoutStyle`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerLayoutStyle) |

#### Returns

`void`

---

### setSizeElement()

```ts
setSizeElement(element): void;
```

Connect or disconnect the element that provides native scroll size.

#### Parameters

| Parameter | Type                    |
| --------- | ----------------------- |
| `element` | `HTMLElement` \| `null` |

#### Returns

`void`
