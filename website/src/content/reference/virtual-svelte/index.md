---
title: "Module: @af-utils/virtual-svelte"
description: Svelte stores and actions used to connect to VirtualScroller.
package: "@af-utils/virtual-svelte"
symbol: ""
kind: module
referencePath: /virtual/reference/virtual-svelte/index
generated: true
---

[**Documentation**](../index)

---

[Documentation](/virtual/reference/index) / @af-utils/virtual-svelte

# @af-utils/virtual-svelte

Svelte stores and actions used to connect to `VirtualScroller`.

## Interfaces

| Interface                                                                                                 | Description                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [VirtualSvelteGridItemBinding](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteGridItemBinding) | Parameters accepted by the [virtualGridItem](/virtual/reference/virtual-svelte/variables/virtualGridItem) action. |
| [VirtualSvelteItemBinding](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteItemBinding)         | Parameters accepted by the [virtualItem](/virtual/reference/virtual-svelte/variables/virtualItem) action.         |
| [VirtualSvelteLayoutBinding](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding)     | Svelte actions and hydration-safe styles for virtual layout elements.                                             |
| [VirtualSvelteListBinding](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteListBinding)         | Range store and layout actions for the common virtual-list shape.                                                 |

## Type Aliases

| Type Alias                                                                    | Description                                                      |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [MaybeReadable](/virtual/reference/virtual-svelte/type-aliases/MaybeReadable) | A static value or a Svelte readable store containing that value. |

## Variables

| Variable                                                                               | Description                                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [virtualContainer](/virtual/reference/virtual-svelte/variables/virtualContainer)       | Attach an arbitrary element as the model's rendered-item container. |
| [virtualGridItem](/virtual/reference/virtual-svelte/variables/virtualGridItem)         | Observe row and column sizes for one rendered grid cell.            |
| [virtualItem](/virtual/reference/virtual-svelte/variables/virtualItem)                 | Observe one rendered virtual item through a Svelte action.          |
| [virtualScroller](/virtual/reference/virtual-svelte/variables/virtualScroller)         | Attach an arbitrary element as the model's scroller.                |
| [virtualStickyFooter](/virtual/reference/virtual-svelte/variables/virtualStickyFooter) | Attach an element as the model's sticky footer.                     |
| [virtualStickyHeader](/virtual/reference/virtual-svelte/variables/virtualStickyHeader) | Attach an element as the model's sticky header.                     |

## Functions

| Function                                                                                   | Description                                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| [createVirtual](/virtual/reference/virtual-svelte/functions/createVirtual)                 | Create a component-owned model and synchronize it with an optional store. |
| [createVirtualLayout](/virtual/reference/virtual-svelte/functions/createVirtualLayout)     | Connect Svelte actions to the framework-neutral virtual layout adapter.   |
| [createVirtualList](/virtual/reference/virtual-svelte/functions/createVirtualList)         | Create the range store and layout actions for a common virtual list.      |
| [createVirtualRange](/virtual/reference/virtual-svelte/functions/createVirtualRange)       | Create a readable array containing the currently rendered indexes.        |
| [createVirtualSnapshot](/virtual/reference/virtual-svelte/functions/createVirtualSnapshot) | Create a readable numeric revision for selected model events.             |
