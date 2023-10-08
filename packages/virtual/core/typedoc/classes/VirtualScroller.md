# Class: VirtualScroller

## Constructors

### constructor

• **new VirtualScroller**(`params?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `params?` | [`VirtualScrollerInitialParams`](../README.md#virtualscrollerinitialparams) |

## Properties

### horizontal

• **horizontal**: `boolean` = `false`

Scroll direction

___

### scrollSize

• **scrollSize**: `number` = `0`

Sum of all item sizes

___

### from

• **from**: `number` = `0`

Items range start

___

### to

• **to**: `number` = `0`

Items range end

___

### sizesHash

• **sizesHash**: `number` = `0`

Hash of item sizes. Changed when at least one visible item is resized.

## Accessors

### visibleFrom

• `get` **visibleFrom**(): `number`

Get snapshot of current scroll position.

#### Returns

`number`

visible item index (double number)

**`Remarks`**

For example `5.3` stands for item at index `5` + `30%` of its size.
Used to remember scroll position before prepending elements.

## Methods

### on

▸ **on**(`callBack`, `events`): () => `void`

Subscribe to model events

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callBack` | () => `void` | event to be triggered |
| `events` | readonly [`Event`](../enums/Event.md)[] \| [`Event`](../enums/Event.md)[] | events to subscribe |

#### Returns

`fn`

unsubscribe function

▸ (): `void`

##### Returns

`void`

___

### getIndex

▸ **getIndex**(`offset`): `number`

Get item index by pixel offset

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `offset` | `number` | pixel offset |

#### Returns

`number`

item index

___

### getOffset

▸ **getOffset**(`index`): `number`

Get pixel offset by item index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | item index |

#### Returns

`number`

pixel offset

___

### getSize

▸ **getSize**(`itemIndex`): `number`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `itemIndex` | `number` | item index |

#### Returns

`number`

last cached item size

___

### setScroller

▸ **setScroller**(`element`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `element` | ``null`` \| [`ScrollElement`](../README.md#scrollelement) |

#### Returns

`void`

___

### setContainer

▸ **setContainer**(`element`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `element` | ``null`` \| `Element` |

#### Returns

`void`

___

### el

▸ **el**(`index`, `element`): `void`

Start observing size of `element` at `index`. Observing is finished if element is falsy.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | item index |
| `element` | ``null`` \| `Element` | element for item |

#### Returns

`void`

___

### setStickyHeader

▸ **setStickyHeader**(`element`): `void`

Start observing size of sticky header `element`. Observing is finished if element is falsy.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | ``null`` \| `Element` | header element |

#### Returns

`void`

___

### setStickyFooter

▸ **setStickyFooter**(`element`): `void`

Start observing size of sticky footer `element`. Observing is finished if element is falsy.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | ``null`` \| `Element` | footer element |

#### Returns

`void`

___

### scrollToOffset

▸ **scrollToOffset**(`offset`, `smooth?`): `void`

Scroll to pixel offset

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `offset` | `number` | offset to scroll to |
| `smooth?` | `boolean` | should smooth scroll be used |

#### Returns

`void`

___

### scrollToIndex

▸ **scrollToIndex**(`index`, `smooth?`): `void`

Scroll to item index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | item index to scroll to |
| `smooth?` | `boolean` | should smooth scroll be used |

#### Returns

`void`

___

### setItemCount

▸ **setItemCount**(`itemCount`): `void`

Notify model about items quantity change

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `itemCount` | `number` | new items quantity |

#### Returns

`void`

___

### set

▸ **set**(`runtimeParams`): `void`

Synchronize runtime parameters

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `runtimeParams` | [`VirtualScrollerRuntimeParams`](../README.md#virtualscrollerruntimeparams) | runtime parameters |

#### Returns

`void`
