Visible elements range must be persisted after new ones are prepended?
VirtualScroller exposes [visibleFrom](https://af-utils.com/virtual/reference/virtual-core.virtualscroller.visiblefrom.md),
which allows to get the position of the first visible item
and [scroll to it](https://af-utils.com/virtual/reference/virtual-core.virtualscroller.scrolltoindex.md).

This example also shows [useVirtualModel](https://af-utils.com/virtual/reference/virtual-react.usevirtualmodel.md) opportuninies.
Classical approach would require `useState` to store items and `useEffect` / `useLayoutEffect` to scroll when they are updated.
If your data flow is very specific or you like to sacrifice readability for the sake of performance - go ahead.
