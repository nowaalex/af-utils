---
title: "Interface: ListItemProps"
description: Props passed to one Solid virtual-list item component.
package: "@af-utils/virtual-solid"
symbol: ListItemProps
kind: interface
referencePath: /virtual/reference/virtual-solid/interfaces/ListItemProps
generated: true
---

# ListItemProps\<Data\>

Props passed to one Solid virtual-list item component.

## Type Parameters

### Data

`Data` = `unknown`

## Properties

### data?

```ts
optional data?: Data;
```

Data forwarded from [ListProps.itemData](/virtual/reference/virtual-solid/type-aliases/ListProps).

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
