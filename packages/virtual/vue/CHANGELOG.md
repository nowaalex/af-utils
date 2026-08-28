# @af-utils/virtual-vue

## 1.0.0

### Major Changes

- 70b2b16: Adopt the framework-neutral DOM layout adapter and core range
  mapping. The Vue adapter now delegates virtual geometry styles to
  `VirtualScrollerLayout`, exposes element refs instead of adapter-owned geometry,
  and does not serialize virtual geometry during SSR.

### Patch Changes

- Updated dependencies [70b2b16]
    - @af-utils/virtual-core@2.0.0

## 0.0.1

- Initial MVP Vue adapter.
