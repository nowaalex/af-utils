---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / createVirtual

# Function: createVirtual()

```ts
function createVirtual(params): VirtualScroller;
```

Create a Solid-owned `VirtualScroller` and synchronize reactive parameters.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`MaybeAccessor`](/virtual/reference/virtual-solid/type-aliases/MaybeAccessor)\<[`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams)\> |

## Returns

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Example

```tsx
const model = createVirtual(() => ({
    itemCount: count(),
    estimatedItemSize: 40
}));
```
