---
generated: true
---

[**Documentation**](../../index)

***

[Documentation](/virtual/reference/index) / [@af-utils/virtual-core](/virtual/reference/virtual-core/index) / VirtualScroller

# Class: VirtualScroller

Core framework-agnostic model.

## Remarks

What it does:

- stores item sizes and positions;

- tracks elements resizing;

- provides performant way to calculate offsets;

- deals with scrolling to item index or to offset;

- emits and allows subscriptions to `VirtualScrollerEvent` flags.

What it doesn't do:

- rendering;

- styling;

- all other framework-related stuff.

## Constructors

### Constructor

```ts
new VirtualScroller(params?): VirtualScroller;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params?` | [`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams) |

#### Returns

`VirtualScroller`

## Properties

### from

```ts
readonly from: number = 0;
```

Items range start with [overscanCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#overscancount) included

#### Remarks

[from](/virtual/reference/virtual-core/classes/VirtualScroller#from) \<= N \< [to](/virtual/reference/virtual-core/classes/VirtualScroller#to)

***

### horizontal

```ts
readonly horizontal: boolean = false;
```

Scroll container orientation.

#### Remarks

Determines properties used for dimension/scroll calculations, for example:

- `scrollTop` / `scrollLeft`;

- `height` / `width`;

- `innerHeight` / `innerWidth`.

***

### scrollSize

```ts
readonly scrollSize: number = 0.0;
```

Sum of all item sizes

***

### to

```ts
readonly to: number = 0;
```

Items range end with [overscanCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#overscancount) included

#### Remarks

[from](/virtual/reference/virtual-core/classes/VirtualScroller#from) \<= N \< [to](/virtual/reference/virtual-core/classes/VirtualScroller#to)

## Accessors

### itemCount

#### Get Signature

```ts
get itemCount(): number;
```

Current number of items in the model.

##### Returns

`number`

***

### visibleFrom

#### Get Signature

```ts
get visibleFrom(): number;
```

Returns snapshot of current scroll position.

##### Remarks

[VirtualScrollerExactPosition](/virtual/reference/virtual-core/type-aliases/VirtualScrollerExactPosition)

##### Returns

`number`

## Methods

### attachItem()

```ts
attachItem(element, index): void;
```

Start observing size of `element` at `index`

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | element for item |
| `index` | `number` | item index |

#### Returns

`void`

#### Remarks

Should be called when element gets mounted. Works in pair with [VirtualScroller.detachItem](/virtual/reference/virtual-core/classes/VirtualScroller#detachitem).

***

### detachItem()

```ts
detachItem(element): void;
```

End observing size of `element`

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` | element for item |

#### Returns

`void`

#### Remarks

Should be called when element is about to unmount or already unmounted. Works in pair with [VirtualScroller.attachItem](/virtual/reference/virtual-core/classes/VirtualScroller#attachitem).

***

### getIndex()

```ts
getIndex(offset): number;
```

Get nearest item index for pixel offset;

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `offset` | `number` | Pixel offset. |

#### Returns

`number`

Nearest item index

#### Remarks

[itemCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#itemcount) must be \> 0.
Possible item index range: 0 \<= N \< [itemCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#itemcount).
Time complexity: `O(log2(itemCount))`

***

### getOffset()

```ts
getOffset(index): number;
```

Get pixel offset by item index;

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | Item index. Must be \<= [itemCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#itemcount) |

#### Returns

`number`

Pixel offset

#### Remarks

Possible offset range: 0 \<= N \<= [scrollSize](/virtual/reference/virtual-core/classes/VirtualScroller#scrollsize).
Time complexity: `O(log2(itemCount))`

***

### getRevision()

```ts
getRevision(events?): number;
```

Return a stable external-store snapshot for the selected events.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `events` | `number` | `VirtualScrollerEvent.ALL` |

#### Returns

`number`

***

### getSize()

```ts
getSize(itemIndex): number;
```

Get last cached item size by item index

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemIndex` | `number` | item index; |

#### Returns

`number`

last cached item size

#### Remarks

Time complexity: `O(1)`

***

### scrollToIndex()

```ts
scrollToIndex(
   index, 
   smooth?, 
   attempts?): void;
```

Scroll to item index

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `index` | `number` | `undefined` | item index to scroll to |
| `smooth?` | `boolean` | `undefined` | should smooth scroll be used |
| `attempts?` | `number` | `DEFAULT_SCROLL_TO_INDEX_ATTEMPTS` | quantity of scroll attempts to be done to ensure scroll offset is correct. Defaults to `5` |

#### Returns

`void`

#### Remarks

Calls [scrollToOffset](/virtual/reference/virtual-core/classes/VirtualScroller#scrolltooffset) with calcuated offset until desired scroll position is reached.

***

### scrollToOffset()

```ts
scrollToOffset(offset, smooth?): void;
```

Scroll to pixel offset

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `offset` | `number` | offset to scroll to |
| `smooth?` | `boolean` | should smooth scroll be used |

#### Returns

`void`

***

### set()

```ts
set(runtimeParams): void;
```

Synchronize runtime parameters

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runtimeParams` | [`VirtualScrollerRuntimeParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerRuntimeParams) | runtime parameters |

#### Returns

`void`

***

### setContainer()

```ts
setContainer(element): void;
```

Informs model about items container element. Usually not needed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` \| `null` | container element |

#### Returns

`void`

#### Remarks

By default top/left offset between scroll container and first scrollable item is `0`.
In this case just [VirtualScroller.setScroller](/virtual/reference/virtual-core/classes/VirtualScroller#setscroller) is needed.
But extra element is needed when something "foreign" stands between scroll container and first scrollable item to measure distance between them.
That extra element is represented as `ItemsContainer` on this schema:

```plaintext
<ScrollContainer>                |.|
     Some header                 |s|
     Another header              |c|
     <ItemsContainer>            |r|
        item 1                   [o]
        item 2                   [l]
        item 3                   [l]
        ...                      [b]
     </ItemsContainer>           |a|
     Some footer                 |r|
</ScrollContainer>               |.|
```

Must be called with `null` before killing the instance.

***

### setItemCount()

```ts
setItemCount(itemCount): void;
```

Notify model about items quantity change

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `itemCount` | `number` | new items quantity. [VirtualScrollerRuntimeParams.itemCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#itemcount) |

#### Returns

`void`

***

### setScroller()

```ts
setScroller(element): void;
```

Informs model about scrollable element.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | \| [`VirtualScrollerScrollElement`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerScrollElement) \| `null` | scroller element |

#### Returns

`void`

#### Remarks

Must be called with `null` before killing the instance.

***

### setStickyFooter()

```ts
setStickyFooter(element): void;
```

Start observing size of sticky footer `element`. Observing is finished if element is `null`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` \| `null` | footer element |

#### Returns

`void`

#### Remarks

Must be called with `null` before killing the instance.

***

### setStickyHeader()

```ts
setStickyHeader(element): void;
```

Start observing size of sticky header `element`. Observing is finished if element is `null`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `element` | `HTMLElement` \| `null` | header element |

#### Returns

`void`

#### Remarks

Must be called with `null` before killing the instance.

***

### subscribe()

```ts
subscribe(callBack, events?): () => void;
```

Subscribe to model events

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `callBack` | () => `void` | `undefined` | event to be triggered |
| `events` | `number` | `VirtualScrollerEvent.ALL` | events to subscribe |

#### Returns

unsubscribe function

() => `void`

***

### updateScrollerOffset()

```ts
updateScrollerOffset(): void;
```

Recalculates the offset between
[scroller element](/virtual/reference/virtual-core/classes/VirtualScroller#setscroller) and [container element](/virtual/reference/virtual-core/classes/VirtualScroller#setcontainer).

#### Returns

`void`

#### Remarks

By default debounced by `SCROLLER_OFFSET_UPDATE_DELAY_MS` (`256`
milliseconds) and called automatically when:

- [setScroller](/virtual/reference/virtual-core/classes/VirtualScroller#setscroller) was called;

- [setContainer](/virtual/reference/virtual-core/classes/VirtualScroller#setcontainer) was called;

- [scroller element](/virtual/reference/virtual-core/classes/VirtualScroller#setscroller) was resized.

Normally this is enough, needed only if something else would trigger this offset change.
