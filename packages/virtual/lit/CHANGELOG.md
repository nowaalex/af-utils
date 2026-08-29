# @af-utils/virtual-lit

## 1.0.1

### Patch Changes

- c2eed28: Compile browser bundles from the workspace Browserslist target while retaining the documented Node and SSR entry points.
- Updated dependencies [c2eed28]
    - @af-utils/virtual-core@2.0.1

## 1.0.0

### Major Changes

- 70b2b16: Adopt the framework-neutral DOM layout adapter and core range
  mapping. The Lit adapter now delegates virtual geometry styles to
  `VirtualScrollerLayout`, exposes element refs instead of adapter-owned geometry,
  and does not serialize virtual geometry during SSR.

### Patch Changes

- Updated dependencies [70b2b16]
    - @af-utils/virtual-core@2.0.0

## 0.0.1

- Initial MVP Lit adapter.
