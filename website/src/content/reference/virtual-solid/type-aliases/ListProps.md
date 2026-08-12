---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / ListProps

# Type Alias: ListProps\<Data\>

```ts
type ListProps<Data> = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref" | "style"> & object;
```

Props accepted by the Solid [List](/virtual/reference/virtual-solid/functions/List) component.

## Type Declaration

### children

```ts
children: (props) => JSX.Element;
```

Fine-grained render function used for one virtual item.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`ListItemProps`](/virtual/reference/virtual-solid/interfaces/ListItemProps)\<`Data`\> |

#### Returns

`JSX.Element`

### footer?

```ts
optional footer?: JSX.Element;
```

Content rendered after the native scroll-size element.

### header?

```ts
optional header?: JSX.Element;
```

Content rendered before the native scroll-size element.

### itemData?

```ts
optional itemData?: Data;
```

Data forwarded to every rendered item.

### model

```ts
model: VirtualScroller;
```

Model owning list geometry and the rendered range.

### style?

```ts
optional style?: VirtualSolidStyle;
```

Inline style merged with the required scroller declarations.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Data` | `unknown` |
