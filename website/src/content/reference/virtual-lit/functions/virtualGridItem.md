---
title: "Function: virtualGridItem()"
description: Lit element directive observed as both a virtual row and column.
package: "@af-utils/virtual-lit"
symbol: virtualGridItem
kind: function
referencePath: /virtual/reference/virtual-lit/functions/virtualGridItem
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-lit](/virtual/reference/virtual-lit/index) / virtualGridItem

# Function: virtualGridItem()

```ts
function virtualGridItem(
    rows,
    row,
    columns,
    column
): DirectiveResult<typeof RefDirective>;
```

Lit element directive observed as both a virtual row and column.

## Parameters

| Parameter | Type                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| `rows`    | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `row`     | `number`                                                                     |
| `columns` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `column`  | `number`                                                                     |

## Returns

`DirectiveResult`\<_typeof_ `RefDirective`\>
