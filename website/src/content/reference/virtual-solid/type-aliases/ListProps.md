---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / ListProps

# Type Alias: ListProps\<Data\>

```ts
type ListProps<Data> = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "children" | "ref" | "style"
> &
  object;
```

Props accepted by the Solid [List](/virtual/reference/virtual-solid/functions/List) component.

## Type Declaration

| Name         | Type                                                                                      | Description                                                  |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `children()` | (`props`) => `JSX.Element`                                                                | Fine-grained render function used for one virtual item.      |
| `footer?`    | `JSX.Element`                                                                             | Content rendered after the native scroll-size element.       |
| `header?`    | `JSX.Element`                                                                             | Content rendered before the native scroll-size element.      |
| `itemData?`  | `Data`                                                                                    | Data forwarded to every rendered item.                       |
| `model`      | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)              | Model owning list geometry and the rendered range.           |
| `style?`     | [`VirtualSolidStyle`](/virtual/reference/virtual-solid/type-aliases/VirtualSolidStyle) | Inline style merged with the required scroller declarations. |

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `Data`         | `unknown`    |
