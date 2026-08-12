---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / ListItemProps

# Interface: ListItemProps\<Data\>

Props passed to one Solid virtual-list item component.

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `Data`         | `unknown`    |

## Properties

| Property                            | Type                                                                         | Description                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| <a id="property-data"></a> `data?`  | `Data`                                                                       | Data forwarded from [ListProps.itemData](/virtual/reference/virtual-solid/type-aliases/ListProps). |
| <a id="property-index"></a> `index` | `number`                                                                     | Current item index.                                                                                   |
| <a id="property-model"></a> `model` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) | Model owning the rendered item range.                                                                 |
