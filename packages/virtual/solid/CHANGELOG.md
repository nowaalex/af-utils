# @af-utils/virtual-solid

## 1.0.0

### Major Changes

- 70b2b16: Adopt the framework-neutral DOM layout adapter and core range
  mapping. The Solid adapter now delegates virtual geometry styles to
  `VirtualScrollerLayout`, exposes reactive element refs instead of adapter-owned
  geometry, and does not serialize virtual geometry during SSR.

### Patch Changes

- Updated dependencies [70b2b16]
    - @af-utils/virtual-core@2.0.0

## 0.0.1

### Patch Changes

- Initial Solid adapter with a list component and focused model, snapshot,
  layout, and item-ref primitives.
