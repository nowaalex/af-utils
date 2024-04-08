Visible elements range must be persisted after new ones are prepended?
VirtualScroller exposes [visibleFrom](https://af-utils.com/virtual/reference/virtual-core.virtual-scroller.visible-from),
which allows to get the position of the first visible item
and [scroll to it](https://af-utils.com/virtual/reference/virtual-core.virtual-scroller.scroll-to-index).

This example also shows [useVirtualModel](https://af-utils.com/virtual/reference/virtual-react.use-virtual-model) opportuninies.
Classical approach would require `useState` to store items and `useEffect` / `useLayoutEffect` to scroll when they are updated.
If your data flow is very specific or you like to sacrifice readability for the sake of performance - go ahead.
