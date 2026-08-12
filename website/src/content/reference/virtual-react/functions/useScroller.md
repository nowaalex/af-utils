---
generated: true
---

[**Documentation**](../../index)

---

[Documentation](/virtual/reference/index) / [@af-utils/virtual-react](/virtual/reference/virtual-react/index) / useScroller

# Function: useScroller()

```ts
function useScroller(model, scroller): void;
```

React hook.
Synchronizes scroller with model.

## Parameters

| Parameter  | Type                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `model`    | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)                                             |
| `scroller` | \| [`VirtualScrollerScrollElement`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerScrollElement) \| `null` |

## Returns

`void`

## Remarks

Should be used in window-scroll cases, otherwise `ref={el => model.setScroller( el )}` is preferrable.
