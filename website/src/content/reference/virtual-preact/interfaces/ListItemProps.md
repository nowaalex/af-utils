---
title: "Interface: ListItemProps"
description: Props passed to one Preact virtual-list item component.
package: "@af-utils/virtual-preact"
symbol: ListItemProps
kind: interface
referencePath: /virtual/reference/virtual-preact/interfaces/ListItemProps
generated: true
---

# ListItemProps\<Data\>

Props passed to one Preact virtual-list item component.

## Type Parameters

### Data

`Data` = `unknown`

## Properties

### data?

```ts
optional data?: Data;
```

Data forwarded from [ListProps.itemData](/virtual/reference/virtual-preact/type-aliases/ListProps).

---

### index

```ts
index: number;
```

Current item index.

---

### model

```ts
model: VirtualScroller;
```

Model owning the rendered item range.
