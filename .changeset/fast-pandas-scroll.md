---
"@af-utils/virtual-core": major
"@af-utils/virtual-react": major
"@af-utils/virtual-preact": major
"@af-utils/virtual-solid": major
"@af-utils/virtual-svelte": major
"@af-utils/virtual-vue": major
"@af-utils/virtual-lit": major
"@af-utils/scrollend-polyfill": patch
---

Replace array-based events with bitmask subscriptions and stable revisions,
add the framework-neutral DOM layout adapter, and make dynamic-size scrolling
stable during native scrollbar drags and programmatic scrolling. Make
`VirtualScrollerLayout` the sole client-side owner of virtual geometry styles,
including the scroller overflow and containment declarations, and expose only
element refs or actions from framework adapters. Virtual geometry is no longer
serialized during SSR. Publish measurements in the native pointer-release turn
so Chromium cannot present a later compositor frame without the rendered range.
Keep paint containment and negative stacking off the multi-million-pixel spacer
and rendered range, move the rendered block with a compositor-backed
translation, and leave registered CSS sticky elements under native
compositor-synchronized positioning. This prevents an unpainted layer after
scrollbar release without introducing top/left range-movement flicker or
main-thread sticky jitter.

Refactor the React adapter around `useVirtualSnapshot`, `useVirtualEffect`,
`useVirtualLayout`, and stable item-ref hooks. Move range mapping to core and
rename list item `i` to `index`.

Add stable coded `VirtualScrollerError` failures with condition-selected
development messages, make runtime updates validate atomically, and add
explicit item-size invalidation, collection splice, and terminal disposal
APIs. Reuse long-lived ResizeObserver and Set instances, keep removed
measurements from being reused for new records, and fix scrollend touch
cancellation and exactly-once dispatch across multiple targets. The React
layout resource now has component lifetime identity instead of relying on a
disposable memo cache. Browser and Node entrypoints are split so only Node
installs the server-side ResizeObserver fallback.

Changing `estimatedItemSize` now resets every cached item size to the new
estimate outside the current rendered range, preserves cached sizes inside the
range, and preserves the idle viewport anchor or end position. Size storage
therefore no longer needs a parallel measured-item bitmap.

Flush a pending items-container offset before native scrollbar release and
disable browser scroll anchoring inside the virtual size element, preventing a
fast thumb release from moving away from the final item. Full cache invalidation
uses `invalidateItemSizes()` directly; the redundant `resetMeasurements` alias
was removed.
