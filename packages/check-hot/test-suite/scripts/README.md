# Self-contained adapter build

Probe manifests must describe the exact code that produces their recipes.
Leaving a runtime dependency such as `semver` outside the adapter graph would
allow that dependency to change after discovery while the old manifest still
looks valid.

`bundle.mjs` bundles shared implementation and third-party runtime helpers into
the published entrypoints. TypeScript still emits declarations first. The build
fails if esbuild reports any remaining external runtime import.

This is package infrastructure, not inspected-library logic: React, Svelte,
Lodash, and date-fns recipes remain in their own adapter source modules, outside
core.
