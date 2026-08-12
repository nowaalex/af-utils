---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / ListItemProps

# Interface: ListItemProps\<Data\>

Props passed to one Solid virtual-list item component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Data` | `unknown` |

## Properties

### data?

```ts
optional data?: Data;
```

Data forwarded from [ListProps.itemData](/virtual/reference/virtual-solid/type-aliases/ListProps).

***

### index

```ts
index: number;
```

Current item index.

***

### model

```ts
model: VirtualScroller;
```

Model owning the rendered item range.
