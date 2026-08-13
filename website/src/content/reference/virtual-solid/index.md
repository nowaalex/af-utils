---
title: "Module: @af-utils/virtual-solid"
description: Solid components and primitives used to connect to VirtualScroller.
package: "@af-utils/virtual-solid"
symbol: ""
kind: module
referencePath: /virtual/reference/virtual-solid/index
generated: true
---

[**Documentation**](../index)

---

[Documentation](/virtual/reference/index) / @af-utils/virtual-solid

# @af-utils/virtual-solid

Solid components and primitives used to connect to `VirtualScroller`.

## Interfaces

| Interface                                                                                | Description                                            |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [ListItemProps](/virtual/reference/virtual-solid/interfaces/ListItemProps)               | Props passed to one Solid virtual-list item component. |
| [VirtualLayoutBinding](/virtual/reference/virtual-solid/interfaces/VirtualLayoutBinding) | DOM refs produced by `createVirtualLayout`.            |

## Type Aliases

| Type Alias                                                                           | Description                                                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [ListProps](/virtual/reference/virtual-solid/type-aliases/ListProps)                 | Props accepted by the Solid [List](/virtual/reference/virtual-solid/functions/List) component. |
| [MaybeAccessor](/virtual/reference/virtual-solid/type-aliases/MaybeAccessor)         | A static value or a reactive Solid accessor returning that value.                              |
| [VirtualElementRef](/virtual/reference/virtual-solid/type-aliases/VirtualElementRef) | Callback suitable for a Solid HTMLElement `ref` attribute.                                     |
| [VirtualSolidStyle](/virtual/reference/virtual-solid/type-aliases/VirtualSolidStyle) | Style declarations accepted by the Solid virtual list.                                         |

## Functions

| Function                                                                                        | Description                                                                 |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [createVirtual](/virtual/reference/virtual-solid/functions/createVirtual)                       | Create a Solid-owned `VirtualScroller` and synchronize reactive parameters. |
| [createVirtualGridItemRef](/virtual/reference/virtual-solid/functions/createVirtualGridItemRef) | Create a Solid ref that observes row and column sizes for one grid cell.    |
| [createVirtualItemRef](/virtual/reference/virtual-solid/functions/createVirtualItemRef)         | Create a Solid ref that observes one rendered virtual item.                 |
| [createVirtualLayout](/virtual/reference/virtual-solid/functions/createVirtualLayout)           | Connect Solid refs to the framework-neutral virtual DOM layout adapter.     |
| [createVirtualSnapshot](/virtual/reference/virtual-solid/functions/createVirtualSnapshot)       | Create a Solid accessor updated by selected model events.                   |
| [List](/virtual/reference/virtual-solid/functions/List)                                         | Render a virtual Solid list with model-owned DOM geometry.                  |
