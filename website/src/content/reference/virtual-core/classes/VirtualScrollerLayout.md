---
title: "Class: VirtualScrollerLayout"
description: Framework-neutral DOM layout adapter for VirtualScroller.
package: "@af-utils/virtual-core"
symbol: VirtualScrollerLayout
kind: class
referencePath: /virtual/reference/virtual-core/classes/VirtualScrollerLayout
generated: true
---

# VirtualScrollerLayout

Framework-neutral DOM layout adapter for [VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller).

## Remarks

It keeps the scroll-size element and rendered-items element synchronized
without scheduling framework renders. Framework adapters expose it through
their native ref, action, or controller primitives. See the
[layout-elements guide](/virtual/guides/layout-elements) for the required
nesting and the role of each element.

## Constructors

### Constructor

```ts
new VirtualScrollerLayout(model): VirtualScrollerLayout;
```

Create a DOM layout adapter for one model.

#### Parameters

##### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

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

Connect or disconnect the [rendered-items element](/virtual/guides/layout-elements#items-ref).

#### Parameters

##### element

`HTMLElement` \| `null`

#### Returns

`void`

---

### setScrollerElement()

```ts
setScrollerElement(element): void;
```

Attach or detach the [scroller element](/virtual/guides/layout-elements#scroller-ref).

#### Parameters

##### element

`HTMLElement` \| `null`

#### Returns

`void`

---

### setSizeElement()

```ts
setSizeElement(element): void;
```

Connect or disconnect the [native size element](/virtual/guides/layout-elements#size-ref).

#### Parameters

##### element

`HTMLElement` \| `null`

#### Returns

`void`
