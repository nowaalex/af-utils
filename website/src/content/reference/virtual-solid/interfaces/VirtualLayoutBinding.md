---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / VirtualLayoutBinding

# Interface: VirtualLayoutBinding

DOM refs and hydration-safe styles produced by `createVirtualLayout`.

## Properties

| Property                                            | Type                                                                                      | Description                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| <a id="property-itemsref"></a> `itemsRef`           | [`VirtualElementRef`](/virtual/reference/virtual-solid/type-aliases/VirtualElementRef) | Attach the absolutely positioned rendered-range container.     |
| <a id="property-itemsstyle"></a> `itemsStyle`       | `string`                                                                                  | Serialized initial rendered-items geometry style.              |
| <a id="property-scrollerref"></a> `scrollerRef`     | [`VirtualElementRef`](/virtual/reference/virtual-solid/type-aliases/VirtualElementRef) | Attach the native element scroller.                            |
| <a id="property-scrollerstyle"></a> `scrollerStyle` | `string`                                                                                  | Serialized initial scroller style for Solid SSR and hydration. |
| <a id="property-sizeref"></a> `sizeRef`             | [`VirtualElementRef`](/virtual/reference/virtual-solid/type-aliases/VirtualElementRef) | Attach the element contributing native scroll extent.          |
| <a id="property-sizestyle"></a> `sizeStyle`         | `string`                                                                                  | Serialized initial native scroll-size style.                   |
