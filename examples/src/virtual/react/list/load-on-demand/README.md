Virtual scroll model can emit [events](https://af-utils.com/virtual/reference/virtual-core.virtual-scroller-event),
which is very convenient for loading something on demand.
Here new posts are loaded when list is scrolled till the end, but this behavior can be easily customized.
Use [useSubscription](https://af-utils.com/virtual/reference/virtual-react.use-subscription) hook to subscribe to events.
