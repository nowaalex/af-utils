Normally [useSyncedStyles](https://af-utils.vercel.app/virtual/reference/virtual-react.usesyncedstyles.md) should be used to help with rendering.
But in some cases (for example table) you may want to render things in different way.
Use [VirtualScroller.on](https://af-utils.vercel.app/virtual/reference/virtual-core.virtualscroller.on.md) method
to subscribe to desired [events](https://af-utils.vercel.app/virtual/reference/virtual-core.virtualscrollerevent.md).
Do not forget to unsubscribe in the end.
