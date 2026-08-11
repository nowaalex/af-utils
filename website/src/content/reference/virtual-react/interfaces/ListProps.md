---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / ListProps

# Interface: ListProps\<C, Data\>

[List](/virtual/reference/virtual-react/functions/List) component props

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `C` *extends* `ElementType` | `"div"` |
| `Data` | `unknown` |

## Properties

### children

```ts
children: ComponentType<ListItemProps<Data>>;
```

***

### component?

```ts
optional component?: C;
```

***

### footer?

```ts
optional footer?: 
  | ReactElement<unknown, string | JSXElementConstructor<any>>
  | null;
```

***

### getKey?

```ts
optional getKey?: (index, itemData) => string | number;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |
| `itemData` | `Data` |

#### Returns

`string` \| `number`

***

### header?

```ts
optional header?: 
  | ReactElement<unknown, string | JSXElementConstructor<any>>
  | null;
```

***

### itemData?

```ts
optional itemData?: Data;
```

could be accessed in [ListItemProps.data](/virtual/reference/virtual-react/interfaces/ListItemProps#data-1)

***

### model

```ts
model: VirtualScroller;
```
