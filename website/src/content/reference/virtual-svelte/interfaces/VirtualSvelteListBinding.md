---
title: "Interface: VirtualSvelteListBinding"
description: Range store and layout actions for the common virtual-list shape.
package: "@af-utils/virtual-svelte"
symbol: VirtualSvelteListBinding
kind: interface
referencePath: /virtual/reference/virtual-svelte/interfaces/VirtualSvelteListBinding
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-svelte](/virtual/reference/virtual-svelte/index) / VirtualSvelteListBinding

# Interface: VirtualSvelteListBinding

Range store and layout actions for the common virtual-list shape.

## Extends

- [`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding)

## Properties

| Property                                  | Type                      | Description                                                          | Inherited from                                                                                                                                                                                                  |
| ----------------------------------------- | ------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-items"></a> `items`       | `Action`\<`HTMLElement`\> | Action attaching the absolutely positioned rendered-range container. | [`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`items`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#property-items)       |
| <a id="property-range"></a> `range`       | `Readable`\<`number`[]\>  | Readable array containing the currently rendered indexes.            | -                                                                                                                                                                                                               |
| <a id="property-scroller"></a> `scroller` | `Action`\<`HTMLElement`\> | Action attaching the native element scroller.                        | [`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`scroller`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#property-scroller) |
| <a id="property-size"></a> `size`         | `Action`\<`HTMLElement`\> | Action attaching the element contributing native scroll extent.      | [`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`size`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#property-size)         |
