# @af-utils/check-hot

## 0.1.1

### Patch Changes

- 2d391a4: Reject malformed, duplicated, stale, and request-inconsistent worker results,
  propagate process-tree cleanup failures, and bound worker cleanup to the complete
  OS containment with POSIX process groups and Windows Job Objects.

## 0.1.0

- Add scenario-driven Node.js and Deno V8 diagnostics.
- Add JavaScriptCore diagnostics for Bun through `bun:jsc`.
- Add source annotation coverage checks for `check-hot:` markers.
- Add Oxc-based static module-graph analysis and safe suite scaffolding.
- Add opt-in low-code probing through separately installed, versioned test runners.
- Add `init --function` so one public callable can be probed without spawning
  attempts for an entire package surface.
- Record and report exact target-package, runner, runtime, and engine versions.
- Allow scenarios to reference one reusable target declaration directly.
- Guarantee executable permissions for the published CLI.
- Resolve package exports/imports and NodeNext/TypeScript edges with Oxc,
  preserving unresolved edges as incomplete coverage.
- Turn typed AST evidence into mutation obligations with per-runtime terminal
  coverage statuses and semantic preflight.
- Require exact active Maglev/TurboFan tiers and distinguish Bun's historical
  DFG counters from current-tier evidence.
- Add ANSI-optional source frames, worker timeouts, worker-only environment,
  lazy target loading, and package-version revalidation.
- Authenticate complete package-local source graphs, resolver-sensitive trees,
  external dependency boundaries, test-runner bundles, and exact runtime
  function source identities before measurement.
- Require args-aware semantic verification and per-variant exact AST-site hits
  in both disposable preflight and guarded measurement before an obligation can
  pass.
- Split analyzer rules into documented feature folders and add a Stryker
  mutation-test ratchet for detectors, dataflow, and mutation safety.
- Add feature-owned problem definitions with likely causes, confirmation steps,
  remediation guidance, and concise human reporting.
- Run optional V8 IC/Map, CPU-profile, and Bun JSC-sampling diagnostics only
  after every primary matrix cell, keeping their evidence non-gating.
- Add integrity-checked offline artifact bundles with raw diagnostic files,
  commands, event streams, runtime identities, and a read-only `report` command.
- Select semantic samples per AST obligation in disposable preflight, persist the
  exact selected sample, and reject missing or tampered measurement replay.
- Derive versioned V8 code-creation locators from authenticated Oxc function
  nodes and refuse unsupported engine/platform/syntax combinations.
- Exercise Lodash, date-fns, React, Svelte compiler, and Three.js only through
  the separate test-runner workspace; no ecosystem recipes live in core.
- Scope guarded deoptimization failures to direct targets by default so runner
  and semantic-verifier churn cannot be blamed on an inspected library; retain
  explicit `all` and `none` policies for suite authors.
