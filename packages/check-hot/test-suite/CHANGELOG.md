# @af-utils/check-hot-test-runners

## 0.1.0

- Add version-aware generic, React, Svelte, Lodash, date-fns, and Three.js test
  runners.
- Keep all checked-library recipes outside `@af-utils/check-hot` core.
- Declare all five ecosystems as optional peers and exercise their installed
  releases in integration probes.
- Publish self-contained bundled runner entrypoints so transitive recipe code is
  authenticated without leaking ecosystem dependencies into core.
- Record accepted, thrown, timed-out, unsupported, and nondeterministic recipe
  attempts; leave exact mutation-family coverage to analyzer-issued obligations
  and args-aware recipes.
- Add a reproducible `threejs/` consumer audit with a compact package-root
  analysis, target-scoped `MathUtils.lerp` runtime proof, portable reports, and
  report-contract tests.
