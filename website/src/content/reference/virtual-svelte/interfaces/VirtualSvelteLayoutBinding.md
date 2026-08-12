---
title: "Interface: VirtualSvelteLayoutBinding"
description: Svelte actions and hydration-safe styles for virtual layout elements.
package: "@af-utils/virtual-svelte"
symbol: VirtualSvelteLayoutBinding
kind: interface
referencePath: /virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-svelte](/virtual/reference/virtual-svelte/index) / VirtualSvelteLayoutBinding

# Interface: VirtualSvelteLayoutBinding

Svelte actions and hydration-safe styles for virtual layout elements.

## Extended by

- [`VirtualSvelteListBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteListBinding)

## Properties

| Property                                            | Type                      | Description                                                          |
| --------------------------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| <a id="property-items"></a> `items`                 | `Action`\<`HTMLElement`\> | Action attaching the absolutely positioned rendered-range container. |
| <a id="property-itemsstyle"></a> `itemsStyle`       | `string`                  | Serialized initial rendered-items geometry style.                    |
| <a id="property-scroller"></a> `scroller`           | `Action`\<`HTMLElement`\> | Action attaching the native element scroller.                        |
| <a id="property-scrollerstyle"></a> `scrollerStyle` | `string`                  | Serialized initial scroller style.                                   |
| <a id="property-size"></a> `size`                   | `Action`\<`HTMLElement`\> | Action attaching the element contributing native scroll extent.      |
| <a id="property-sizestyle"></a> `sizeStyle`         | `string`                  | Serialized initial native scroll-size style.                         |
