---
title: "Module: @af-utils/virtual-preact"
description: Preact components and hooks used to connect to VirtualScroller.
package: "@af-utils/virtual-preact"
symbol: ""
kind: module
referencePath: /virtual/reference/virtual-preact/index
generated: true
---

[**Documentation**](../index)

---

[Documentation](/virtual/reference/index) / @af-utils/virtual-preact

# @af-utils/virtual-preact

Preact components and hooks used to connect to `VirtualScroller`.

## Interfaces

| Interface                                                                                             | Description                                                                                            |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [ListItemProps](/virtual/reference/virtual-preact/interfaces/ListItemProps)                           | Props passed to one Preact virtual-list item component.                                                |
| [VirtualPreactLayoutBinding](/virtual/reference/virtual-preact/interfaces/VirtualPreactLayoutBinding) | DOM refs produced by [useVirtualLayout](/virtual/reference/virtual-preact/functions/useVirtualLayout). |

## Type Aliases

| Type Alias                                                            | Description                                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [ListProps](/virtual/reference/virtual-preact/type-aliases/ListProps) | Props accepted by the Preact [List](/virtual/reference/virtual-preact/functions/List) component. |

## Functions

| Function                                                                                   | Description                                                                  |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [List](/virtual/reference/virtual-preact/functions/List)                                   | Render a virtual Preact list with model-owned DOM geometry.                  |
| [useScroller](/virtual/reference/virtual-preact/functions/useScroller)                     | Synchronize a window or external scroller with a Preact-owned model.         |
| [useVirtual](/virtual/reference/virtual-preact/functions/useVirtual)                       | Create a Preact-owned virtual-scroller model and synchronize its parameters. |
| [useVirtualEffect](/virtual/reference/virtual-preact/functions/useVirtualEffect)           | Subscribe to model changes without scheduling a Preact render.               |
| [useVirtualGridItemRef](/virtual/reference/virtual-preact/functions/useVirtualGridItemRef) | Observe row and column sizes for one rendered grid cell.                     |
| [useVirtualItemRef](/virtual/reference/virtual-preact/functions/useVirtualItemRef)         | Observe one rendered item using a stable Preact callback ref.                |
| [useVirtualLayout](/virtual/reference/virtual-preact/functions/useVirtualLayout)           | Connect stable Preact refs to the framework-neutral virtual layout adapter.  |
| [useVirtualModel](/virtual/reference/virtual-preact/functions/useVirtualModel)             | Create and retain exactly one Preact-owned virtual-scroller model.           |
| [useVirtualSnapshot](/virtual/reference/virtual-preact/functions/useVirtualSnapshot)       | Re-render the current Preact component when selected model events publish.   |
