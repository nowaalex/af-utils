---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-solid](/virtual/reference/virtual-solid/index) / createVirtualLayout

# Function: createVirtualLayout()

```ts
function createVirtualLayout(model, scrollerStyle?): VirtualLayoutBinding;
```

Connect Solid refs to the framework-neutral virtual DOM layout adapter.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | [`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller) |
| `scrollerStyle` | [`VirtualSolidStyle`](/virtual/reference/virtual-solid/type-aliases/VirtualSolidStyle) |

## Returns

[`VirtualLayoutBinding`](/virtual/reference/virtual-solid/interfaces/VirtualLayoutBinding)

Hydration-safe styles and refs for the scroller, scroll-size, and
rendered-items elements.
