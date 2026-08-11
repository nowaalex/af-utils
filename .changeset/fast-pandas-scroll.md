---
"@af-utils/virtual-core": major
"@af-utils/virtual-react": major
---

Replace array-based events with bitmask subscriptions and stable revisions,
add the framework-neutral DOM layout adapter, and make dynamic-size scrolling
stable during native scrollbar drags and programmatic scrolling. Serialize the
same virtual geometry during SSR and keep native scrolling inert until the
model is attached, so delayed hydration cannot expose empty ranges. Publish
measurements in the native pointer-release turn so Chromium cannot present a
later compositor frame without the rendered range. Keep paint containment and
negative stacking off the multi-million-pixel spacer and rendered range, move
the rendered block with a compositor-backed translation, and leave registered
CSS sticky elements under native compositor-synchronized positioning. This
prevents an unpainted layer after scrollbar release without introducing
top/left range-movement flicker or main-thread sticky jitter.

Refactor the React adapter around `useVirtualSnapshot`, `useVirtualEffect`,
`useVirtualLayout`, and stable item-ref hooks. Move range mapping to core and
rename list item `i` to `index`.
