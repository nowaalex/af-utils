---
slug: virtual-core.virtualscroller 
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Reference home](/virtual/reference/index) &gt; [@af-utils/virtual-core](/virtual/reference/virtual-core) &gt; [VirtualScroller](/virtual/reference/virtual-core.virtualscroller)

# VirtualScroller class

Core framework-agnostic model.

**Signature:**

```typescript
declare class VirtualScroller 
```

## Remarks

What it does:

- stores item sizes and positions;

- tracks elements resizing;

- provides performant way to calculate offsets;

- deals with scrolling to item index or to offset;

- emits and allows to subscribe to [events](/virtual/reference/virtual-core.virtualscrollerevent)<!-- -->.

What it doesn't do:

- rendering;

- styling;

- all other framework-related stuff.

## Constructors

<table><thead><tr><th>

Constructor


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[(constructor)(params)](/virtual/reference/virtual-core.virtualscroller._constructor_)


</td><td>


</td><td>

Constructs a new instance of the `VirtualScroller` class


</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property


</th><th>

Modifiers


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[from](/virtual/reference/virtual-core.virtualscroller.from)


</td><td>

`readonly`


</td><td>

number


</td><td>

Items range start with [overscanCount](/virtual/reference/virtual-core.virtualscrollerruntimeparams.overscancount) included


</td></tr>
<tr><td>

[horizontal](/virtual/reference/virtual-core.virtualscroller.horizontal)


</td><td>

`readonly`


</td><td>

boolean


</td><td>

Scroll container orientation.


</td></tr>
<tr><td>

[scrollSize](/virtual/reference/virtual-core.virtualscroller.scrollsize)


</td><td>

`readonly`


</td><td>

number


</td><td>

Sum of all item sizes


</td></tr>
<tr><td>

[sizesHash](/virtual/reference/virtual-core.virtualscroller.sizeshash)


</td><td>

`readonly`


</td><td>

number


</td><td>

Hash of item sizes. Changed when at least one visible item is resized


</td></tr>
<tr><td>

[to](/virtual/reference/virtual-core.virtualscroller.to)


</td><td>

`readonly`


</td><td>

number


</td><td>

Items range end with [overscanCount](/virtual/reference/virtual-core.virtualscrollerruntimeparams.overscancount) included


</td></tr>
<tr><td>

[visibleFrom](/virtual/reference/virtual-core.virtualscroller.visiblefrom)


</td><td>

`readonly`


</td><td>

[VirtualScrollerExactPosition](/virtual/reference/virtual-core.virtualscrollerexactposition)


</td><td>

Returns snapshot of current scroll position.


</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[attachItem(element, index)](/virtual/reference/virtual-core.virtualscroller.attachitem)


</td><td>


</td><td>

Start observing size of `element` at `index`


</td></tr>
<tr><td>

[detachItem(element)](/virtual/reference/virtual-core.virtualscroller.detachitem)


</td><td>


</td><td>

End observing size of `element`


</td></tr>
<tr><td>

[getIndex(offset)](/virtual/reference/virtual-core.virtualscroller.getindex)


</td><td>


</td><td>

Get nearest item index for pixel offset;


</td></tr>
<tr><td>

[getOffset(index)](/virtual/reference/virtual-core.virtualscroller.getoffset)


</td><td>


</td><td>

Get pixel offset by item index;


</td></tr>
<tr><td>

[getSize(itemIndex)](/virtual/reference/virtual-core.virtualscroller.getsize)


</td><td>


</td><td>

Get last cached item size by item index


</td></tr>
<tr><td>

[on(callBack, events)](/virtual/reference/virtual-core.virtualscroller.on)


</td><td>


</td><td>

Subscribe to model events


</td></tr>
<tr><td>

[scrollToIndex(index, smooth, attempts)](/virtual/reference/virtual-core.virtualscroller.scrolltoindex)


</td><td>


</td><td>

Scroll to item index


</td></tr>
<tr><td>

[scrollToOffset(offset, smooth)](/virtual/reference/virtual-core.virtualscroller.scrolltooffset)


</td><td>


</td><td>

Scroll to pixel offset


</td></tr>
<tr><td>

[set(runtimeParams)](/virtual/reference/virtual-core.virtualscroller.set)


</td><td>


</td><td>

Synchronize runtime parameters


</td></tr>
<tr><td>

[setContainer(element)](/virtual/reference/virtual-core.virtualscroller.setcontainer)


</td><td>


</td><td>

Informs model about items container element. Usually not needed.


</td></tr>
<tr><td>

[setItemCount(itemCount)](/virtual/reference/virtual-core.virtualscroller.setitemcount)


</td><td>


</td><td>

Notify model about items quantity change


</td></tr>
<tr><td>

[setScroller(element)](/virtual/reference/virtual-core.virtualscroller.setscroller)


</td><td>


</td><td>

Informs model about scrollable element.


</td></tr>
<tr><td>

[setStickyFooter(element)](/virtual/reference/virtual-core.virtualscroller.setstickyfooter)


</td><td>


</td><td>

Start observing size of sticky footer `element`<!-- -->. Observing is finished if element is `null`<!-- -->.


</td></tr>
<tr><td>

[setStickyHeader(element)](/virtual/reference/virtual-core.virtualscroller.setstickyheader)


</td><td>


</td><td>

Start observing size of sticky header `element`<!-- -->. Observing is finished if element is `null`<!-- -->.


</td></tr>
<tr><td>

[updateScrollerOffset()](/virtual/reference/virtual-core.virtualscroller.updatescrolleroffset)


</td><td>


</td><td>

Recalculates the offset between [scroller element](/virtual/reference/virtual-core.virtualscroller.setscroller) and [container element](/virtual/reference/virtual-core.virtualscroller.setcontainer)<!-- -->.


</td></tr>
</tbody></table>