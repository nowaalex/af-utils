Normally [useSyncedStyles](https://af-utils.com/virtual/reference/virtual-react.use-synced-styles) should be used to help with rendering.
But in some cases (for example table) you may want to render things in different way.
Use [VirtualScroller.on](https://af-utils.com/virtual/reference/virtual-core.virtual-scroller.on) method
to subscribe to desired [events](https://af-utils.com/virtual/reference/virtual-core.virtual-scroller-event).
Do not forget to unsubscribe in the end.
