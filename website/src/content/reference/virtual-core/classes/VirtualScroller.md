---
title: "Class: VirtualScroller"
description: Core framework-agnostic model.
package: "@af-utils/virtual-core"
symbol: VirtualScroller
kind: class
referencePath: /virtual/reference/virtual-core/classes/VirtualScroller
generated: true
---

# VirtualScroller

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

Create a virtual-scroller model from optional initial geometry.

#### Parameters

##### params?

[`VirtualScrollerInitialParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams)

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

This value is exposed as a directly readable runtime field and is
therefore technically assignable. Consumers must treat it as read-only:
assigning it is unsupported and may break model invariants.

---

### horizontal

```ts
readonly horizontal: boolean = false;
```

Current scroll container orientation; see
[VirtualScrollerInitialParams.horizontal](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#horizontal).

#### Remarks

This value is exposed as a directly readable runtime field and is
therefore technically assignable. Consumers must treat it as read-only:
assigning it is unsupported and may break model invariants.

---

### scrollSize

```ts
readonly scrollSize: number = 0.0;
```

Sum of all published item sizes, in CSS pixels.

---

### to

```ts
readonly to: number = 0;
```

Items range end with [overscanCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#overscancount) included

#### Remarks

[from](/virtual/reference/virtual-core/classes/VirtualScroller#from) \<= N \< [to](/virtual/reference/virtual-core/classes/VirtualScroller#to)

This value is exposed as a directly readable runtime field and is
therefore technically assignable. Consumers must treat it as read-only:
assigning it is unsupported and may break model invariants.

## Accessors

### itemCount

#### Get Signature

```ts
get itemCount(): number;
```

Current number of items in the model.

##### Returns

`number`

---

### renderedRangeOffset

#### Get Signature

```ts
get renderedRangeOffset(): number;
```

Return the item-space layout offset of the current rendered range.

##### Remarks

Normally this equals `getOffset(from)`. While size publication is
deferred at the native scroll end, the range is aligned with the frozen
public [scrollSize](/virtual/reference/virtual-core/classes/VirtualScroller#scrollsize) so newly measured
geometry cannot leave a temporary blank area.

Time complexity: `O(log2(itemCount))`.

##### Returns

`number`

Offset for positioning the range, in CSS pixels.

---

### renderedRangeSize

#### Get Signature

```ts
get renderedRangeSize(): number;
```

Return the current rendered range extent, including overscan.

##### Remarks

Time complexity: `O(log2(itemCount))`.

##### Returns

`number`

Size from [from](/virtual/reference/virtual-core/classes/VirtualScroller#from) through the
exclusive [to](/virtual/reference/virtual-core/classes/VirtualScroller#to) boundary, in CSS pixels.

---

### visibleFrom

#### Get Signature

```ts
get visibleFrom(): number;
```

Return the current scroll position as a fractional item index.

##### Remarks

The integer part identifies the first visible item and the fractional
part describes progress through it. For example, `12.25` means that item
`12` is first and `25%` of its CSS-pixel extent is above the visible edge.
See [VirtualScrollerExactPosition](/virtual/reference/virtual-core/type-aliases/VirtualScrollerExactPosition).

##### Returns

`number`

## Methods

### attachItem()

```ts
attachItem(element, index): void;
```

Start observing size of `element` at `index`

#### Parameters

##### element

`HTMLElement`

element for item

##### index

`number`

item index

#### Returns

`void`

#### Remarks

Should be called when element gets mounted. Works in pair with [VirtualScroller.detachItem](/virtual/reference/virtual-core/classes/VirtualScroller#detachitem).

---

### detachItem()

```ts
detachItem(element): void;
```

End observing size of `element`

#### Parameters

##### element

`HTMLElement`

element for item

#### Returns

`void`

#### Remarks

Should be called when element is about to unmount or already unmounted. Works in pair with [VirtualScroller.attachItem](/virtual/reference/virtual-core/classes/VirtualScroller#attachitem).

---

### dispose()

```ts
dispose(): void;
```

Release every DOM resource and subscription owned by this model.

#### Returns

`void`

---

### getIndex()

```ts
getIndex(offset): number;
```

Return the item containing an item-space coordinate.

#### Parameters

##### offset

`number`

Coordinate from the start of item `0`, in CSS pixels.

#### Returns

`number`

Item index in the range `0 <= index < itemCount`.

#### Remarks

[itemCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#itemcount) must be \> 0.
With item sizes `[40px, 60px]`, `getIndex(55)` returns `1`:

```plaintext
0px             40px                           100px
|---- item 0 ----|---------- item 1 ------------|
                              ^ 55px
```

Time complexity: `O(log2(itemCount))`.

---

### getOffset()

```ts
getOffset(index): number;
```

Return the leading item-space coordinate of an item boundary.

#### Parameters

##### index

`number`

Boundary index in `0 <= index <= itemCount`.

#### Returns

`number`

Offset from item `0`, in CSS pixels.

#### Remarks

`getOffset(0)` is always `0`; `getOffset(itemCount)` equals the current
internal total extent. With item sizes `[40px, 60px]`, `getOffset(1)` is
`40px` and `getOffset(2)` is `100px`.

Time complexity: `O(log2(itemCount))`.

---

### getRevision()

```ts
getRevision(events?): number;
```

Return a stable external-store snapshot for the selected events.

#### Parameters

##### events?

`number` = `VirtualScrollerEventFlag.ALL`

#### Returns

`number`

---

### getSize()

```ts
getSize(itemIndex): number;
```

Return the current measured or estimated extent of one item.

#### Parameters

##### itemIndex

`number`

Item index in `0 <= itemIndex < itemCount`.

#### Returns

`number`

Cached item extent in CSS pixels.

#### Remarks

Unmeasured and invalidated items return the current estimate.
Time complexity: `O(1)`.

---

### invalidateItemSizes()

```ts
invalidateItemSizes(from?, to?): void;
```

Reset cached sizes in a half-open item range to the current estimate.

#### Parameters

##### from?

`number` = `0`

##### to?

`number` = `...`

#### Returns

`void`

---

### scrollToIndex()

```ts
scrollToIndex(
   index,
   smooth?,
   attempts?): void;
```

Scroll to an integer or fractional item position.

#### Parameters

##### index

`number`

Exact item position; `12.5` targets the midpoint of item
`12` at the visible edge after accounting for the sticky header.

##### smooth?

`boolean`

Whether to request native smooth scrolling.

##### attempts?

`number` = `DEFAULT_SCROLL_TO_INDEX_ATTEMPTS`

Maximum corrections while measured sizes converge;
defaults to `5`.

#### Returns

`void`

#### Remarks

Checks the target immediately and then while measurements converge,
calling [scrollToOffset](/virtual/reference/virtual-core/classes/VirtualScroller#scrolltooffset) only when
rendering replaces estimated CSS-pixel sizes and moves the native target.

---

### scrollToOffset()

```ts
scrollToOffset(offset, smooth?): void;
```

Scroll to an item-space CSS-pixel coordinate.

#### Parameters

##### offset

`number`

Distance from the start of item `0`, in CSS pixels.

##### smooth?

`boolean`

Whether to request native smooth scrolling.

#### Returns

`void`

#### Remarks

The items-container offset is added before dispatching the
native scroll, and the result is clamped to the current scrollable range:

```plaintext
native target = items-container offset + requested item-space offset
```

---

### set()

```ts
set(runtimeParams): void;
```

Synchronize runtime parameters

#### Parameters

##### runtimeParams

[`VirtualScrollerRuntimeParams`](/virtual/reference/virtual-core/interfaces/VirtualScrollerRuntimeParams)

runtime parameters

#### Returns

`void`

---

### setContainer()

```ts
setContainer(element): void;
```

Informs model about items container element. Usually not needed.

#### Parameters

##### element

`HTMLElement` \| `null`

container element

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

[dispose](/virtual/reference/virtual-core/classes/VirtualScroller#dispose) disconnects it automatically.

---

### setItemCount()

```ts
setItemCount(itemCount): void;
```

Notify model about items quantity change

#### Parameters

##### itemCount

`number`

new items quantity. [VirtualScrollerRuntimeParams.itemCount](/virtual/reference/virtual-core/interfaces/VirtualScrollerInitialParams#itemcount)

#### Returns

`void`

---

### setScroller()

```ts
setScroller(element): void;
```

Informs model about scrollable element.

#### Parameters

##### element

\| [`VirtualScrollerScrollElement`](/virtual/reference/virtual-core/type-aliases/VirtualScrollerScrollElement)
\| `null`

scroller element

#### Returns

`void`

#### Remarks

[dispose](/virtual/reference/virtual-core/classes/VirtualScroller#dispose) disconnects it automatically.

---

### setStickyFooter()

```ts
setStickyFooter(element): void;
```

Start observing size of sticky footer `element`. Observing is finished if element is `null`.

#### Parameters

##### element

`HTMLElement` \| `null`

footer element

#### Returns

`void`

#### Remarks

Positioning remains native CSS `sticky`, keeping motion synchronized with
compositor scrolling. If its computed `z-index` is `auto`, the model adds
a default stacking level and restores the original inline value when the
element is replaced or cleared.

[dispose](/virtual/reference/virtual-core/classes/VirtualScroller#dispose) disconnects it automatically.

---

### setStickyHeader()

```ts
setStickyHeader(element): void;
```

Start observing size of sticky header `element`. Observing is finished if element is `null`.

#### Parameters

##### element

`HTMLElement` \| `null`

header element

#### Returns

`void`

#### Remarks

Positioning remains native CSS `sticky`, keeping motion synchronized with
compositor scrolling. If its computed `z-index` is `auto`, the model adds
a default stacking level and restores the original inline value when the
element is replaced or cleared.

[dispose](/virtual/reference/virtual-core/classes/VirtualScroller#dispose) disconnects it automatically.

---

### spliceItems()

```ts
spliceItems(
   start,
   deleteCount,
   insertCount): void;
```

Apply an index-based data splice to the size cache.

#### Parameters

##### start

`number`

##### deleteCount

`number`

##### insertCount

`number`

#### Returns

`void`

#### Remarks

Retained cached sizes are shifted with their items, inserted
items use the current estimate, and scroll preservation remains explicit.
The operation has `O(allocated capacity)` complexity.

---

### subscribe()

```ts
subscribe(callBack, events?): () => void;
```

Subscribe to model events

#### Parameters

##### callBack

() => `void`

event to be triggered

##### events?

`number` = `VirtualScrollerEventFlag.ALL`

events to subscribe

#### Returns

unsubscribe function

() => `void`

---

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

The stored value is measured in CSS pixels along the configured axis:

```plaintext
native origin |---- items-container offset ----| item 0
```

Normally the automatic calls are enough. Call this method when external
DOM changes move the items container relative to the scroller.
