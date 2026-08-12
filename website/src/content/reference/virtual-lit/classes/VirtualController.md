---
title: "Class: VirtualController"
description: Lit reactive controller owning one virtual-scroller model.
package: "@af-utils/virtual-lit"
symbol: VirtualController
kind: class
referencePath: /virtual/reference/virtual-lit/classes/VirtualController
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-lit](/virtual/reference/virtual-lit/index) / VirtualController

# Class: VirtualController

Lit reactive controller owning one virtual-scroller model.

## Implements

- `ReactiveController`

## Constructors

### Constructor

```ts
new VirtualController(host, params): VirtualController;
```

Create and register a virtual model controller.

#### Parameters

| Parameter | Type                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `host`    | `ReactiveControllerHost`                                                                                        |
| `params`  | () => [`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams) |

#### Returns

`VirtualController`

## Properties

| Property                            | Modifier   | Type                                                                         |
| ----------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| <a id="property-model"></a> `model` | `readonly` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |

## Methods

### hostConnected()

```ts
hostConnected(): void;
```

Preserve the model across transient DOM moves during hydration.

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

Dispose model resources with the host.

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

Synchronize model parameters after each host update.

#### Returns

`void`

#### Implementation of

```ts
ReactiveController.hostUpdated;
```
