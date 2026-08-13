---
title: "Type Alias: ListProps"
description: Props accepted by the Preact List component.
package: "@af-utils/virtual-preact"
symbol: ListProps
kind: typealias
referencePath: /virtual/reference/virtual-preact/type-aliases/ListProps
generated: true
---

# ListProps\<Data\>

```ts
type ListProps<Data> = Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    "children" | "ref" | "style"
> &
    object;
```

Props accepted by the Preact [List](/virtual/reference/virtual-preact/functions/List) component.

## Type Declaration

### children

```ts
children: ComponentType<ListItemProps<Data>>;
```

Component used to render one virtual item.

### footer?

```ts
optional footer?: ComponentChildren;
```

Content rendered after the native scroll-size element.

### getKey?

```ts
optional getKey?: (index, itemData) => string | number;
```

Return a stable key for one item index.

#### Parameters

##### index

`number`

##### itemData

`Data`

#### Returns

`string` \| `number`

### header?

```ts
optional header?: ComponentChildren;
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
optional style?: JSX.CSSProperties;
```

Inline style merged with the required scroller declarations.

## Type Parameters

### Data

`Data` = `unknown`
