---
title: "Module: @af-utils/virtual-core"
description: Core framework-agnostic model.
package: "@af-utils/virtual-core"
symbol: ""
kind: module
referencePath: /virtual/reference/virtual-core/index
generated: true
---

# core

Core framework-agnostic model.

## Remarks

What it does:

- stores item sizes and positions;

- tracks elements resizing;

- provides performant way to calculate offsets;

- deals with scrolling to item index or to offset;

- emits and allows subscriptions to `VirtualScrollerEvent` flags.

What it doesn't do:

- rendering;

- styling;

- all other framework-related stuff.

## Classes

- [VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller)
- [VirtualScrollerError](/virtual/reference/virtual-core/classes/VirtualScrollerError)
- [VirtualScrollerLayout](/virtual/reference/virtual-core/classes/VirtualScrollerLayout)

## Interfaces

- [VirtualScrollerInitialParams](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams)
- [VirtualScrollerRuntimeParams](/virtual/reference/virtual-core/interfaces/VirtualScrollerRuntimeParams)

## Type Aliases

- [VirtualScrollerErrorCode](/virtual/reference/virtual-core/type-aliases/VirtualScrollerErrorCode)
- [VirtualScrollerEvent](/virtual/reference/virtual-core/type-aliases/VirtualScrollerEvent)
- [VirtualScrollerEventMask](/virtual/reference/virtual-core/type-aliases/VirtualScrollerEventMask)
- [VirtualScrollerExactPosition](/virtual/reference/virtual-core/type-aliases/VirtualScrollerExactPosition)
- [VirtualScrollerScrollElement](/virtual/reference/virtual-core/type-aliases/VirtualScrollerScrollElement)

## Variables

- [assert](/virtual/reference/virtual-core/variables/assert)
- [VirtualScrollerErrorCode](/virtual/reference/virtual-core/variables/VirtualScrollerErrorCode)
- [VirtualScrollerEvent](/virtual/reference/virtual-core/variables/VirtualScrollerEvent)

## Functions

- [mapVirtualRange](/virtual/reference/virtual-core/functions/mapVirtualRange)
- [mapVirtualRangeWithOffset](/virtual/reference/virtual-core/functions/mapVirtualRangeWithOffset)
