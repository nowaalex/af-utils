# @af-utils/virtual-preact

## 1.0.0

### Major Changes

- 70b2b16: Adopt the framework-neutral DOM layout adapter and core range
  mapping. The Preact adapter now delegates virtual geometry styles to
  `VirtualScrollerLayout`, exposes stable element refs instead of adapter-owned
  geometry, and does not serialize virtual geometry during SSR.

### Patch Changes

- Updated dependencies [70b2b16]
    - @af-utils/virtual-core@2.0.0

## 0.0.1

- Initial Preact adapter with a list component and model, snapshot, layout, and
  item-ref hooks.
