---
title: "Interface: ListProps"
description: List component props
package: "@af-utils/virtual-react"
symbol: ListProps
kind: interface
referencePath: /virtual/reference/virtual-react/interfaces/ListProps
generated: true
---

# ListProps\<C, Data\>

[List](/virtual/reference/virtual-react/functions/List) component props

## Type Parameters

### C

`C` _extends_ `ElementType` = `"div"`

### Data

`Data` = `unknown`

## Properties

### children

```ts
children: ComponentType<ListItemProps<Data>>;
```

---

### component?

```ts
optional component?: C;
```

---

### footer?

```ts
optional footer?:
  | ReactElement<unknown, string | JSXElementConstructor<any>>
  | null;
```

---

### getKey?

```ts
optional getKey?: (index, itemData) => string | number;
```

#### Parameters

##### index

`number`

##### itemData

`Data`

#### Returns

`string` \| `number`

---

### header?

```ts
optional header?:
  | ReactElement<unknown, string | JSXElementConstructor<any>>
  | null;
```

---

### itemData?

```ts
optional itemData?: Data;
```

could be accessed in [ListItemProps.data](/virtual/reference/virtual-react/interfaces/ListItemProps#data-1)

---

### model

```ts
model: VirtualScroller;
```
