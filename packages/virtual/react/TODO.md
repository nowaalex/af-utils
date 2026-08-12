# TODO

## React and DOM style ownership

- Make `VirtualScrollerLayout` the exclusive client-side owner of virtual
  geometry styles after DOM attachment. React should only serialize the
  initial SSR/hydration values.
- Prevent concurrent React commits from reapplying stale scroll-size, range
  size, or range transform snapshots over newer imperative model updates.
- Consider publishing virtual geometry through CSS custom properties so React
  and the framework-neutral DOM adapter never write the same style property.
- Expose an atomic cached range snapshot containing `revision`, `from`, and
  `to`; render children from that snapshot instead of separately reading
  mutable model fields.
- Keep React responsible only for ref lifecycle, keys, and child
  reconciliation; keep observers, native scrolling, and geometry updates in
  the model/DOM adapter.
