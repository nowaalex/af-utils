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
without scheduling framework renders. Framework adapters expose it through
their native ref, action, or controller primitives.

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
setScrollerElement(element): void;
```

Attach or detach the scroll container and apply its required styles.

#### Parameters

| Parameter | Type                    |
| --------- | ----------------------- |
| `element` | `HTMLElement` \| `null` |

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
