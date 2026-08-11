---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useVirtualGridItemRef

# Function: useVirtualGridItemRef()

```ts
function useVirtualGridItemRef(
   rows, 
   rowIndex, 
   columns, 
columnIndex): RefCallback<HTMLElement>;
```

Observe row and column sizes for one rendered grid cell.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rows` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `rowIndex` | `number` |
| `columns` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `columnIndex` | `number` |

## Returns

`RefCallback`\<`HTMLElement`\>
