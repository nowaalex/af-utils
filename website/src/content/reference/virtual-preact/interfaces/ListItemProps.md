---
title: "Interface: ListItemProps"
description: Props passed to one Preact virtual-list item component.
package: "@af-utils/virtual-preact"
symbol: ListItemProps
kind: interface
referencePath: /virtual/reference/virtual-preact/interfaces/ListItemProps
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-preact](/virtual/reference/virtual-preact/index) / ListItemProps

# Interface: ListItemProps\<Data\>

Props passed to one Preact virtual-list item component.

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `Data`         | `unknown`    |

## Properties

| Property                            | Type                                                                         | Description                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| <a id="property-data"></a> `data?`  | `Data`                                                                       | Data forwarded from [ListProps.itemData](/virtual/reference/virtual-preact/type-aliases/ListProps). |
| <a id="property-index"></a> `index` | `number`                                                                     | Current item index.                                                                                 |
| <a id="property-model"></a> `model` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | Model owning the rendered item range.                                                               |
