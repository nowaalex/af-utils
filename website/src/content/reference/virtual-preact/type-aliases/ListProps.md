---
title: "Type Alias: ListProps"
description: Props accepted by the Preact List component.
package: "@af-utils/virtual-preact"
symbol: ListProps
kind: typealias
referencePath: /virtual/reference/virtual-preact/type-aliases/ListProps
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-preact](/virtual/reference/virtual-preact/index) / ListProps

# Type Alias: ListProps\<Data\>

```ts
type ListProps<Data> = Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    "children" | "ref" | "style"
> &
    object;
```

Props accepted by the Preact [List](/virtual/reference/virtual-preact/functions/List) component.

## Type Declaration

| Name        | Type                                                                                                       | Description                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `children`  | `ComponentType`\<[`ListItemProps`](/virtual/reference/virtual-preact/interfaces/ListItemProps)\<`Data`\>\> | Component used to render one virtual item.                   |
| `footer?`   | `ComponentChildren`                                                                                        | Content rendered after the native scroll-size element.       |
| `getKey()?` | (`index`, `itemData`) => `string` \| `number`                                                              | Return a stable key for one item index.                      |
| `header?`   | `ComponentChildren`                                                                                        | Content rendered before the native scroll-size element.      |
| `itemData?` | `Data`                                                                                                     | Data forwarded to every rendered item.                       |
| `model`     | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)                               | Model owning list geometry and the rendered range.           |
| `style?`    | `JSX.CSSProperties`                                                                                        | Inline style merged with the required scroller declarations. |

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `Data`         | `unknown`    |
