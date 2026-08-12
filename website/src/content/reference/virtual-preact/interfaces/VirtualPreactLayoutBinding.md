---
title: "Interface: VirtualPreactLayoutBinding"
description: DOM refs and hydration-safe styles produced by useVirtualLayout.
package: "@af-utils/virtual-preact"
symbol: VirtualPreactLayoutBinding
kind: interface
referencePath: /virtual/reference/virtual-preact/interfaces/VirtualPreactLayoutBinding
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-preact](/virtual/reference/virtual-preact/index) / VirtualPreactLayoutBinding

# Interface: VirtualPreactLayoutBinding

DOM refs and hydration-safe styles produced by [useVirtualLayout](/virtual/reference/virtual-preact/functions/useVirtualLayout).

## Properties

| Property                                            | Type                           | Description                                                |
| --------------------------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| <a id="property-itemsref"></a> `itemsRef`           | `RefCallback`\<`HTMLElement`\> | Attach the absolutely positioned rendered-range container. |
| <a id="property-itemsstyle"></a> `itemsStyle`       | `CSSProperties`                | Initial rendered-items geometry style.                     |
| <a id="property-scrollerref"></a> `scrollerRef`     | `RefCallback`\<`HTMLElement`\> | Attach the native element scroller.                        |
| <a id="property-scrollerstyle"></a> `scrollerStyle` | `CSSProperties`                | Initial and interactive scroller style.                    |
| <a id="property-sizeref"></a> `sizeRef`             | `RefCallback`\<`HTMLElement`\> | Attach the element contributing native scroll extent.      |
| <a id="property-sizestyle"></a> `sizeStyle`         | `CSSProperties`                | Initial native scroll-size style.                          |
