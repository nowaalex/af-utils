---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / ListProps

# Interface: ListProps\<C, Data\>

[List](/virtual/reference/virtual-react/functions/List) component props

## Type Parameters

| Type Parameter              | Default type |
| --------------------------- | ------------ |
| `C` _extends_ `ElementType` | `"div"`      |
| `Data`                      | `unknown`    |

## Properties

| Property                                     | Type                                                                                                         | Description                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| <a id="property-children"></a> `children`    | `ComponentType`\<[`ListItemProps`](/virtual/reference/virtual-react/interfaces/ListItemProps)\<`Data`\>\> | -                                                                                                                     |
| <a id="property-component"></a> `component?` | `C`                                                                                                          | -                                                                                                                     |
| <a id="property-footer"></a> `footer?`       | \| `ReactElement`\<`unknown`, `string` \| `JSXElementConstructor`\<`any`\>\> \| `null`                       | -                                                                                                                     |
| <a id="property-getkey"></a> `getKey?`       | (`index`, `itemData`) => `string` \| `number`                                                                | -                                                                                                                     |
| <a id="property-header"></a> `header?`       | \| `ReactElement`\<`unknown`, `string` \| `JSXElementConstructor`\<`any`\>\> \| `null`                       | -                                                                                                                     |
| <a id="property-itemdata"></a> `itemData?`   | `Data`                                                                                                       | could be accessed in [ListItemProps.data](/virtual/reference/virtual-react/interfaces/ListItemProps#property-data) |
| <a id="property-model"></a> `model`          | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)                                 | -                                                                                                                     |
