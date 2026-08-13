---
title: "Class: VirtualSnapshotController"
description: Lit controller that requests host updates for selected model events.
package: "@af-utils/virtual-lit"
symbol: VirtualSnapshotController
kind: class
referencePath: /virtual/reference/virtual-lit/classes/VirtualSnapshotController
generated: true
---

# VirtualSnapshotController

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

##### host

`ReactiveControllerHost`

##### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

##### events?

`number` = `VirtualScrollerEvent.RANGE`

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
