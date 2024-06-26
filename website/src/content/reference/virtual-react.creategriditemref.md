---
slug: virtual-react.creategriditemref 
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Reference home](/virtual/reference/index) &gt; [@af-utils/virtual-react](/virtual/reference/virtual-react) &gt; [createGridItemRef](/virtual/reference/virtual-react.creategriditemref)

# createGridItemRef() function

Creates callback ref for grid item at specified index.

**Signature:**

```typescript
createGridItemRef: (rowsModel: VirtualScroller, rowItemIndex: number, colsModel: VirtualScroller, colItemIndex: number) => (el: HTMLElement | null) => void
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

rowsModel


</td><td>

[VirtualScroller](/virtual/reference/virtual-core.virtualscroller)


</td><td>


</td></tr>
<tr><td>

rowItemIndex


</td><td>

number


</td><td>

row item index


</td></tr>
<tr><td>

colsModel


</td><td>

[VirtualScroller](/virtual/reference/virtual-core.virtualscroller)


</td><td>


</td></tr>
<tr><td>

colItemIndex


</td><td>

number


</td><td>

column item index


</td></tr>
</tbody></table>

**Returns**

(el: HTMLElement \| null) =&gt; void

callback ref

## Remarks

Calls [VirtualScroller.attachItem()](/virtual/reference/virtual-core.virtualscroller.attachitem) when item is mounted and [VirtualScroller.detachItem()](/virtual/reference/virtual-core.virtualscroller.detachitem) when item is about to unmount.

[createListItemRef()](/virtual/reference/virtual-react.createlistitemref) differences:

- works with two models at the same time;

- column widths are taken only from first mounted row;

- row heights are taken only from first mounted column.

