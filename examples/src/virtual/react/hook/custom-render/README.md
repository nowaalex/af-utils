Normally [useVirtualLayout](https://af-utils.com/virtual/reference/virtual-react/functions/useVirtualLayout) should be used to synchronize layout elements.
But in some cases (for example table) you may want to render things in different way.
Use [VirtualScroller.subscribe](https://af-utils.com/virtual/reference/virtual-core/classes/VirtualScroller#subscribe)
to subscribe to desired [events](https://af-utils.com/virtual/reference/virtual-core/variables/VirtualScrollerEvent).
Do not forget to unsubscribe in the end.
