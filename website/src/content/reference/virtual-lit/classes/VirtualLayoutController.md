---
title: "Class: VirtualLayoutController"
description: Lit refs and styles backed by the framework-neutral layout adapter.
package: "@af-utils/virtual-lit"
symbol: VirtualLayoutController
kind: class
referencePath: /virtual/reference/virtual-lit/classes/VirtualLayoutController
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-lit](/virtual/reference/virtual-lit/index) / VirtualLayoutController

# Class: VirtualLayoutController

Lit refs and styles backed by the framework-neutral layout adapter.

## Implements

- `ReactiveController`

## Constructors

### Constructor

```ts
new VirtualLayoutController(
   host,
   model,
   scrollerStyle?): VirtualLayoutController;
```

Create layout bindings for a Lit host.

#### Parameters

| Parameter       | Type                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| `host`          | `ReactiveControllerHost`                                                     |
| `model`         | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `scrollerStyle` | `VirtualScrollerLayoutStyle`                                                 |

#### Returns

`VirtualLayoutController`

## Properties

| Property                                            | Modifier   | Type                         |
| --------------------------------------------------- | ---------- | ---------------------------- |
| <a id="property-itemsref"></a> `itemsRef`           | `readonly` | `RefOrCallback`              |
| <a id="property-itemsstyle"></a> `itemsStyle`       | `readonly` | `VirtualScrollerLayoutStyle` |
| <a id="property-scrollerref"></a> `scrollerRef`     | `readonly` | `RefOrCallback`              |
| <a id="property-scrollerstyle"></a> `scrollerStyle` | `readonly` | `VirtualScrollerLayoutStyle` |
| <a id="property-sizeref"></a> `sizeRef`             | `readonly` | `RefOrCallback`              |
| <a id="property-sizestyle"></a> `sizeStyle`         | `readonly` | `VirtualScrollerLayoutStyle` |

## Methods

### connect()

```ts
connect(
   scroller,
   sizeElement,
   itemsElement): void;
```

Explicitly reconnect layout elements after an external hydration pass.

#### Parameters

| Parameter      | Type          |
| -------------- | ------------- |
| `scroller`     | `HTMLElement` |
| `sizeElement`  | `HTMLElement` |
| `itemsElement` | `HTMLElement` |

#### Returns

`void`

---

### hostConnected()

```ts
hostConnected(): void;
```

Mark the layout controller as attached.

#### Returns

`void`

#### Implementation of

```ts
ReactiveController.hostConnected;
```

---

### hostDisconnected()

```ts
hostDisconnected(): void;
```

Dispose DOM bindings with the host.

#### Returns

`void`

#### Implementation of

```ts
ReactiveController.hostDisconnected;
```
