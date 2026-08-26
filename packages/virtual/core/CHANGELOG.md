# @af-utils/virtual-core

## 2.0.0

### Major Changes

- 70b2b16: Replace array-based events with bitmask subscriptions and stable revisions,
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

## 1.0.2

### Patch Changes

- upgraded dependencies, added float dimensions support

## 1.0.1

### Patch Changes

- optimized package size, improved tsdoc and error handling

## 1.0.0

### Major Changes

- BREAKING CHANGES: removed VirtualScroller.el, it is replaced by attachItem/detachItem.

## 0.0.25

### Patch Changes

- dff0b7e: improved logging/warnings + fixed VirtualScroller.getOffset ssr bug

## 0.0.24

### Patch Changes

- 81ee040: removed bundlesize files from package exports

## 0.0.23

### Patch Changes

- new bundlesize format + better minification + const -> var change for better perf in output bundle

## 0.0.22

### Patch Changes

- squeezed some more bytes from core

## 0.0.21

### Patch Changes

- optimized bundle size & batch singleton

## 0.0.20

### Patch Changes

- converted hooks to arrow functions

## 0.0.19

### Patch Changes

- upgraded deps, improved use-sync-external-shim import

## 0.0.18

### Patch Changes

- started using exports

## 0.0.17

### Patch Changes

- improved bundle size, improved rollup scripts, repaired annotations

## 0.0.16

### Patch Changes

- improved folder structure, improved testing

## 0.0.15

### Patch Changes

- improved updateScrollOffset & docs

## 0.0.14

### Patch Changes

- fixed react mapVisibleRangeWithOffset bug + improved scroll

## 0.0.13

### Patch Changes

- changed scroll resize timers. Fixes rare bug on slow devices

## 0.0.12

### Patch Changes

- Updated dependencies
    - @af-utils/scrollend-polyfill@0.0.9

## 0.0.11

### Patch Changes

- reduced number of dependencies + upgraded website
- Updated dependencies
    - @af-utils/scrollend-polyfill@0.0.8

## 0.0.10

### Patch Changes

- upgraded scroll algo & types
- Updated dependencies
    - @af-utils/scrollend-polyfill@0.0.7

## 0.0.9

### Patch Changes

- improved docs & scroll

## 0.0.8

### Patch Changes

- improved VirtualScroller.scrollToIndex
- 900f29c: imroved VirtualScroller.scrollToIndex
- Updated dependencies
- Updated dependencies [900f29c]
    - @af-utils/scrollend-polyfill@0.0.6

## 0.0.7

### Patch Changes

- mjs > ts conversion, pruned unused deps
- Updated dependencies
    - @af-utils/scrollend-polyfill@0.0.5

## 0.0.6

### Patch Changes

- shrinked build size
- Updated dependencies
    - @af-utils/scrollend-polyfill@0.0.4

## 0.0.5

### Patch Changes

- upgraded scrollend-polyfill
- Updated dependencies
    - @af-utils/scrollend-polyfill@0.0.3

## 0.0.4

### Patch Changes

- upgraded scrollToIndex, improved docs, added scrollend polyfill
- Updated dependencies
    - @af-utils/scrollend-polyfill@0.0.2

## 0.0.3

### Patch Changes

- docs upgraded

## 0.0.2

### Patch Changes

- initial publish
