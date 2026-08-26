# Source and resolver identity

> **Change Contract**
>
> - **Responsibility:** authenticate the package-local runtime source and
>   resolver state used by an analysis plan.
> - **Boundary:** identity must not depend on package-manager layout or ignore a
>   generated file before output-safety proves that exclusion harmless.
> - **Invariants:** hashing order is deterministic and every runtime-relevant
>   local source, native asset, and resolver input is represented.
> - **Configuration owner:** [index.ts](./index.ts) owns identity collection and
>   hashing.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

A hot-path result is meaningful only for the source graph that was analyzed.
Hashing just the entry file is insufficient:

```text
index.js -> ./implementation.js
```

Changing `implementation.js`, adding a higher-priority `implementation.ts`, or
changing `package.json` conditions can invalidate the old experiment while
leaving `index.js` untouched.

`createHotPackageTreeIdentity` therefore hashes package-local runtime sources,
native assets, and resolver configuration with deterministic code-unit path
ordering. Documentation and arbitrary result JSON do not invalidate a plan.
The generated suite may be ignored only after the analyzer proves that its path
cannot become an import target or public export.

`node_modules` is deliberately not folded into the selected package identity.
The module-graph analyzer records those imports as external boundaries instead
of pretending that package-manager layout belongs to the target package.
Test-runners must bundle runtime dependencies, so their probe manifests have no
such unauthenticated boundary.

Negative controls are in `tests/source-identity.test.ts`,
`tests/module-suite.test.ts`, and `tests/ast/graph.test.ts`.
