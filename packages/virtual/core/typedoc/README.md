# @af-utils/virtual-core

## Enumerations

- [Event](enums/Event.md)

## Classes

- [VirtualScroller](classes/VirtualScroller.md)

## Type Aliases

### ScrollElement

Ƭ **ScrollElement**: `HTMLElement` \| `Window`

___

### VirtualScrollerRuntimeParams

Ƭ **VirtualScrollerRuntimeParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `overscanCount?` | `number` |
| `itemCount?` | `number` |
| `estimatedItemSize?` | `number` |

___

### VirtualScrollerInitialParams

Ƭ **VirtualScrollerInitialParams**: [`VirtualScrollerRuntimeParams`](README.md#virtualscrollerruntimeparams) & { `horizontal?`: `boolean` ; `estimatedWidgetSize?`: `number` ; `estimatedScrollElementOffset?`: `number`  }
