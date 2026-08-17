# check-hot workspaces

The `check-hot` project aims to find optimization weaknesses in JS/TS code on
V8, JavaScriptCore, and other supported JavaScript engines with minimal manual
scenario authoring. AST-proven facts must become automatic check obligations;
the report must expose every passed, failed, blocked, unsupported, or explicitly
ignored obligation instead of silently dropping coverage.

This is not an ESLint/Oxlint/Biome replacement. It does not enforce syntax or
style rules. AST and provenance select runtime experiments; engine evidence
decides whether an optimization weakness exists. Package analysis follows
`package.json` exports/imports and TypeScript resolution. Human output may use
colorized source code frames, while JSON stays stable and ANSI-free.

The directory contains two deliberately separate npm packages:

- [`core`](./core/README.md) publishes `@af-utils/check-hot`: AST analysis,
  mutation planning, runtime orchestration, engine oracles, and reporting.
- [`test-suite`](./test-suite/README.md) publishes
  `@af-utils/check-hot-test-runners`: optional, versioned seed providers for
  external ecosystems.

The core never imports the test-suite package and contains no registry or API
knowledge for React, Svelte, Lodash, date-fns, Three.js, or another inspected
library.
Adding an ecosystem adapter must not require changing core.
