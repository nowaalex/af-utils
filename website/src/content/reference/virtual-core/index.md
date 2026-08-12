---
generated: true
---

[**Documentation**](../index)

---

[Documentation](/virtual/reference/index) / @af-utils/virtual-core

# @af-utils/virtual-core

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

| Class                                                                                     | Description                                                                                                             |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller)             | Core framework-agnostic model.                                                                                          |
| [VirtualScrollerError](/virtual/reference/virtual-core/classes/VirtualScrollerError)   | Error thrown for an invalid virtual-scroller operation.                                                                 |
| [VirtualScrollerLayout](/virtual/reference/virtual-core/classes/VirtualScrollerLayout) | Framework-neutral DOM layout adapter for [VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller). |

## Interfaces

| Interface                                                                                                  | Description                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [VirtualScrollerInitialParams](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams) | All [VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller) parameters (that may / may not change over time).                                                                                              |
| [VirtualScrollerRuntimeParams](/virtual/reference/virtual-core/interfaces/VirtualScrollerRuntimeParams) | [VirtualScroller](/virtual/reference/virtual-core/classes/VirtualScroller) parameters that may change over time. Used as [VirtualScroller.set](/virtual/reference/virtual-core/classes/VirtualScroller#set) argument type. |

## Type Aliases

| Type Alias                                                                                                   | Description                                                                                              |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [VirtualScrollerErrorCode](/virtual/reference/virtual-core/type-aliases/VirtualScrollerErrorCode)         | Type of a stable machine-readable virtual-scroller error code.                                           |
| [VirtualScrollerEvent](/virtual/reference/virtual-core/type-aliases/VirtualScrollerEvent)                 | `VirtualScrollerEvent` is exported as a constant, so a separate type is needed to emulate enum behavior. |
| [VirtualScrollerEventMask](/virtual/reference/virtual-core/type-aliases/VirtualScrollerEventMask)         | -                                                                                                        |
| [VirtualScrollerExactPosition](/virtual/reference/virtual-core/type-aliases/VirtualScrollerExactPosition) | Numeric snapshot of scroll position                                                                      |
| [VirtualScrollerLayoutStyle](/virtual/reference/virtual-core/type-aliases/VirtualScrollerLayoutStyle)     | Serializable inline styles shared by server and client layout adapters.                                  |
| [VirtualScrollerScrollElement](/virtual/reference/virtual-core/type-aliases/VirtualScrollerScrollElement) | Scrollable container type                                                                                |

## Variables

| Variable                                                                                          | Description                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [assert](/virtual/reference/virtual-core/variables/assert)                                     | Assert a condition using the active development or production error build.                                                                                                                                                         |
| [VirtualScrollerErrorCode](/virtual/reference/virtual-core/variables/VirtualScrollerErrorCode) | Stable machine-readable error codes emitted by the virtual-scroller packages.                                                                                                                                                      |
| [VirtualScrollerEvent](/virtual/reference/virtual-core/variables/VirtualScrollerEvent)         | Bit flags accepted by [VirtualScroller.subscribe](/virtual/reference/virtual-core/classes/VirtualScroller#subscribe) and [VirtualScroller.getRevision](/virtual/reference/virtual-core/classes/VirtualScroller#getrevision). |

## Functions

| Function                                                                                            | Description                                                                |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [mapVirtualRange](/virtual/reference/virtual-core/functions/mapVirtualRange)                     | Map the current rendered range without first allocating an indexes array.  |
| [mapVirtualRangeWithOffset](/virtual/reference/virtual-core/functions/mapVirtualRangeWithOffset) | Map the current rendered range and provide the pixel offset of every item. |
