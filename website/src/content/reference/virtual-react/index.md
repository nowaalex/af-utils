---
title: "Module: @af-utils/virtual-react"
description: React components and hooks used to connect to VirtualScroller.
package: "@af-utils/virtual-react"
symbol: ""
kind: module
referencePath: /virtual/reference/virtual-react/index
generated: true
---

[**Documentation**](../index)

---

[Documentation](/virtual/reference/index) / @af-utils/virtual-react

# @af-utils/virtual-react

React components and hooks used to connect to `VirtualScroller`.

## Interfaces

| Interface                                                                  | Description                                                             |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [ListItemProps](/virtual/reference/virtual-react/interfaces/ListItemProps) | Props passed to List item                                               |
| [ListProps](/virtual/reference/virtual-react/interfaces/ListProps)         | [List](/virtual/reference/virtual-react/functions/List) component props |

## Functions

| Function                                                                                  | Description                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [List](/virtual/reference/virtual-react/functions/List)                                   | React component. Small abstraction, which in 90% cases allows to avoid hook boilerplate.                                       |
| [useScroller](/virtual/reference/virtual-react/functions/useScroller)                     | React hook. Synchronizes scroller with model.                                                                                  |
| [useVirtual](/virtual/reference/virtual-react/functions/useVirtual)                       | React hook. Calls [useVirtualModel](/virtual/reference/virtual-react/functions/useVirtualModel) and synchronizes it with props |
| [useVirtualEffect](/virtual/reference/virtual-react/functions/useVirtualEffect)           | Subscribe to model changes without scheduling a React render.                                                                  |
| [useVirtualGridItemRef](/virtual/reference/virtual-react/functions/useVirtualGridItemRef) | Observe row and column sizes for one rendered grid cell.                                                                       |
| [useVirtualItemRef](/virtual/reference/virtual-react/functions/useVirtualItemRef)         | Observe one rendered item using a stable React callback ref.                                                                   |
| [useVirtualLayout](/virtual/reference/virtual-react/functions/useVirtualLayout)           | Connect stable React refs to the framework-neutral virtual layout adapter.                                                     |
| [useVirtualModel](/virtual/reference/virtual-react/functions/useVirtualModel)             | React hook. Creates and stores exactly one `VirtualScroller` instance. It is not recreated during component lifecycle.         |
| [useVirtualSnapshot](/virtual/reference/virtual-react/functions/useVirtualSnapshot)       | Re-render the current component when selected model events are published.                                                      |
