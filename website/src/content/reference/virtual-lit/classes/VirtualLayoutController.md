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

See the [layout-elements guide](/virtual/guides/layout-elements) for their
nesting and responsibilities.

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
readonly itemsRef: Ref<HTMLElement>;
```

Attach the [rendered-items element](/virtual/guides/layout-elements#items-ref).

---

### scrollerRef

```ts
readonly scrollerRef: Ref<HTMLElement>;
```

Attach the [scroller element](/virtual/guides/layout-elements#scroller-ref).

---

### sizeRef

```ts
readonly sizeRef: Ref<HTMLElement>;
```

Attach the [native size element](/virtual/guides/layout-elements#size-ref).

## Methods

### connect()

```ts
connect(
   scroller,
   sizeElement,
   itemsElement): void;
```

Explicitly reconnect the three
[layout elements](/virtual/guides/layout-elements).

#### Parameters

##### scroller

`HTMLElement` \| `null`

##### sizeElement

`HTMLElement` \| `null`

##### itemsElement

`HTMLElement` \| `null`

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

---

### hostUpdated()

```ts
hostUpdated(): void;
```

Attach the elements collected by Lit's ref directives after rendering.

#### Returns

`void`

#### Implementation of

```ts
ReactiveController.hostUpdated;
```
