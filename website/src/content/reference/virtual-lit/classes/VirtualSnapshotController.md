---
title: "Class: VirtualSnapshotController"
description: Lit controller that requests host updates for selected model events.
package: "@af-utils/virtual-lit"
symbol: VirtualSnapshotController
kind: class
referencePath: /virtual/reference/virtual-lit/classes/VirtualSnapshotController
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-lit](/virtual/reference/virtual-lit/index) / VirtualSnapshotController

# Class: VirtualSnapshotController

Lit controller that requests host updates for selected model events.

## Implements

- `ReactiveController`

## Constructors

### Constructor

```ts
new VirtualSnapshotController(
   host,
   model,
   events?): VirtualSnapshotController;
```

Create and register an event bridge.

#### Parameters

| Parameter | Type                                                                         | Default value                |
| --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `host`    | `ReactiveControllerHost`                                                     | `undefined`                  |
| `model`   | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | `undefined`                  |
| `events`  | `number`                                                                     | `VirtualScrollerEvent.RANGE` |

#### Returns

`VirtualSnapshotController`

## Methods

### hostConnected()

```ts
hostConnected(): void;
```

Subscribe when the host connects.

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

Unsubscribe when the host disconnects.

#### Returns

`void`

#### Implementation of

```ts
ReactiveController.hostDisconnected;
```
