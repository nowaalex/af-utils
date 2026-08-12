---
title: "Module: @af-utils/virtual-vue"
description: Vue primitives used to connect to VirtualScroller.
package: "@af-utils/virtual-vue"
symbol: ""
kind: module
referencePath: /virtual/reference/virtual-vue/index
generated: true
---

[**Documentation**](../index)

---

[Documentation](/virtual/reference/index) / @af-utils/virtual-vue

# @af-utils/virtual-vue

Vue primitives used to connect to `VirtualScroller`.

## Interfaces

| Interface                                                                                    | Description                                                     |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [VirtualVueLayoutBinding](/virtual/reference/virtual-vue/interfaces/VirtualVueLayoutBinding) | Vue refs and hydration-safe styles for virtual layout elements. |

## Type Aliases

| Type Alias                                                                                 | Description                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [VirtualVueElementRef](/virtual/reference/virtual-vue/type-aliases/VirtualVueElementRef)   | DOM template-ref callback accepted by Vue.                                                                         |
| [VirtualVueItemBinding](/virtual/reference/virtual-vue/type-aliases/VirtualVueItemBinding) | Directive value accepted by [virtualItemDirective](/virtual/reference/virtual-vue/variables/virtualItemDirective). |

## Variables

| Variable                                                                              | Description                                                        |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [virtualItemDirective](/virtual/reference/virtual-vue/variables/virtualItemDirective) | Vue directive that observes the size of one rendered virtual item. |
| [VirtualList](/virtual/reference/virtual-vue/variables/VirtualList)                   | Minimal Vue virtual-list component for the common block-list case. |

## Functions

| Function                                                                          | Description                                                             |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [useVirtual](/virtual/reference/virtual-vue/functions/useVirtual)                 | Vue-owned virtual-scroller model synchronized with reactive parameters. |
| [useVirtualItemRef](/virtual/reference/virtual-vue/functions/useVirtualItemRef)   | Create a Vue template-ref callback that observes one virtual item.      |
| [useVirtualLayout](/virtual/reference/virtual-vue/functions/useVirtualLayout)     | Connect Vue template refs to the framework-neutral layout adapter.      |
| [useVirtualRange](/virtual/reference/virtual-vue/functions/useVirtualRange)       | Reactive rendered indexes for a Vue render function or template.        |
| [useVirtualSnapshot](/virtual/reference/virtual-vue/functions/useVirtualSnapshot) | Reactive revision for selected model events.                            |
