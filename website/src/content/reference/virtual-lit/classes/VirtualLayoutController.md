---
title: "Class: VirtualLayoutController"
description: Lit refs backed by the framework-neutral layout adapter.
package: "@af-utils/virtual-lit"
symbol: VirtualLayoutController
kind: class
referencePath: /virtual/reference/virtual-lit/classes/VirtualLayoutController
generated: true
---

# VirtualLayoutController

Lit refs backed by the framework-neutral layout adapter.

## Implements

- `ReactiveController`

## Constructors

### Constructor

```ts
new VirtualLayoutController(host, model): VirtualLayoutController;
```

Create layout bindings for a Lit host.

#### Parameters

##### host

`ReactiveControllerHost`

##### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

#### Returns

`VirtualLayoutController`

## Properties

### itemsRef

```ts
readonly itemsRef: RefOrCallback;
```

---

### scrollerRef

```ts
readonly scrollerRef: RefOrCallback;
```

---

### sizeRef

```ts
readonly sizeRef: RefOrCallback;
```

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

##### scroller

`HTMLElement`

##### sizeElement

`HTMLElement`

##### itemsElement

`HTMLElement`

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
