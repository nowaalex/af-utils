Virtual scroll model can emit [events](https://af-utils.vercel.app/virtual/reference/virtual-core.virtualscrollevent.md),
which is very convenient for loading something on demand.
Here new posts are loaded when list is scrolled till the end, but this behavior can be easily customized.
Use [useSubscription](https://af-utils.vercel.app/virtual/reference/virtual-react.usesubscription.md) hook to subscribe to events.
