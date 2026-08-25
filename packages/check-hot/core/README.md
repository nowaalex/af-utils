# @af-utils/check-hot

> **Change Contract**
>
> - **Responsibility:** turn package-aware source facts into isolated runtime
>   experiments and honest engine-evidence reports.
> - **Boundary:** static findings are hypotheses, not lint failures; optional
>   ecosystem recipes live in `@af-utils/check-hot-test-runners`.
> - **Invariants:** every requested obligation has a terminal outcome, measured
>   code and analyzed code have authenticated identity, and unavailable proof
>   can never become a pass.
> - **Configuration owners:** CLI and report types live in source; problem and
>   oracle folders own their IDs and proof boundaries; package scripts own
>   verification entry points.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

`check-hot` finds JavaScript/TypeScript code paths that do not remain healthy in
the optimizing compilers of Node.js, Deno, Bun, and future supported runtimes.
It combines package-aware AST analysis, automatically planned input mutations,
fresh-process runtime scenarios, engine evidence, and a coverage ledger.

## Status: alpha MVP

`check-hot` is currently an alpha-quality minimum viable product. Its public
TypeScript API, CLI flags, generated suite and probe-manifest formats, problem
catalog, JSON reports, and test-runner protocol may change between releases.
Backward compatibility with earlier alpha versions is not guaranteed, and a
breaking change may be shipped without a compatibility layer or deprecation
period. Pin the exact package version in CI and regenerate suites/manifests after
upgrading.

```sh
pnpm add --save-dev @af-utils/check-hot @af-utils/check-hot-test-runners lodash
check-hot analyze lodash --code-frame --color auto
check-hot init lodash \
  --probe \
  --function head \
  --test-runner @af-utils/check-hot-test-runners/lodash \
  --probe-runtime node \
  --out check-hot.node.mjs
check-hot run check-hot.node.mjs --runtime node
```

For an integrity-checked offline report and optional non-gating diagnostics:

```sh
check-hot run check-hot.node.mjs \
  --runtime node \
  --artifacts .check-hot/node-001 \
  --diagnostics v8-ic-maps,cpu-profile \
  --diagnostic-stress v8-ic-maps=1000,cpu-profile=50000
check-hot report .check-hot/node-001 --verbose
```

Diagnostics run in separate processes and cannot change the primary
tier/deoptimization/coverage verdict. Raw engine logs and profiles can be large,
unredacted, and sensitive. Source-map correlation remains intentionally
postponed.

This example uses an optional external lodash adapter only to provide safe seed
recipes. Lodash-specific code is not part of core. A non-zero `run` exit is an
expected useful outcome when an optimization fails or required evidence remains
blocked; inspect the report and its reproduction command. For an unrecognized
module, `init` without `--probe` creates an honest scaffold: add deterministic
samples to the generated file before running it.

## How decisions are made

The analyzer turns proven source facts into explicit runtime obligations. Fresh
workers then verify semantic behavior, source identity, and the evidence that
the selected JavaScript engine can actually expose. A missing graph edge,
unsupported oracle, or incomplete measurement stays visible instead of being
promoted to success.

The detailed pipeline and invariants live in
[Architecture](./docs/architecture.md). Product boundaries and deliberate
non-goals live in [Related tools](./docs/related-tools.md).

## Packages

The optional `@af-utils/check-hot-test-runners` package contains maintained
seed providers for external ecosystems. No inspected-library registry or recipe
lives in this core package. See the
[workspace boundary](https://github.com/nowaalex/af-utils/tree/master/packages/check-hot)
and the
[test-suite documentation](https://github.com/nowaalex/af-utils/tree/master/packages/check-hot/test-suite).

## Documentation

- [Architecture and product invariants](./docs/architecture.md)
- [Typed problem model and feature ownership](./docs/problems.md)
- [AST analysis, mutation planning, and coverage](./docs/analyzer.md)
- [Static problem families, experiments, and possible fixes](./docs/rules.md)
- [Suite authoring and `check-hot:` markers](./docs/suite-authoring.md)
- [Runtime and engine oracles](./docs/runtime-oracles.md)
- [Console and JSON reporting](./docs/reporting.md)
- [Related tools and design boundaries](./docs/related-tools.md)
- [Verification strategy](./docs/testing.md)

## CLI

```sh
check-hot analyze <path-or-package> [--top 20] [--json report.json]
check-hot init <path-or-package> \
  --probe \
  --function <name[,name...]> \
  --test-runner <external-runner> \
  --probe-runtime node \
  --out check-hot.node.mjs
check-hot run check-hot.node.mjs \
  --runtime node \
  --tier maglev,turbofan \
  --mode combined,isolated \
  --repeat 2 \
  --concurrency 2 \
  --json artifacts/check-hot.json
```

Matrix cells and probe coordinates run sequentially by default. Explicit
`--concurrency` enables a bounded process pool while retaining matrix/manifest
order. Phases within one matrix cell and the two determinism attempts for one
probe coordinate always remain sequential. Use concurrency only when suite
fixtures and external resources are safe to access from independent processes
at the same time.

Optional diagnostics start only after the primary matrix is complete, but each
one repeats setup and the selected scenarios in a fresh process. Local heap
state is disposable; filesystem, network, database, and service side effects
are not rolled back. Keep those workloads idempotent or externally sandboxed.
Use `--diagnostic-stress kind=iterations,...` to keep verbose IC/Map logs
bounded while giving statistical CPU sampling a longer observation window.

Analyzer evidence is runtime-specific. Repeat `init` with
`--probe-runtime deno` and `--probe-runtime bun` and distinct output names when
all three runtimes are required; one suite cannot replay another runtime's
conditional-export graph or probe fingerprint.

`CHECK_HOT_NODE`, `CHECK_HOT_DENO`, and `CHECK_HOT_BUN` select runtime
executables. The published `check-hot` bin is executable; the build verifies
mode `0755`.

Passing means the declared and automatically derived workloads remained valid
on the exact runtime, engine, oracle, and adapter versions in the report. It is
not a guarantee about untested inputs or future engine releases.

Guarded deoptimization checks default to `--deopts targets`: a deopt in the
runner, semantic verifier, or orchestration harness is retained in raw output
but cannot be blamed on the inspected function. Suite authors auditing their
own complete process may opt into `--deopts all`; `--deopts none` disables this
oracle explicitly.

With `init --probe`, core asks the external runner only for declarative recipe
labels. It then imports the target afresh for every attempt, runs each recipe
twice in separate hard-timeout processes, and continues after throws,
unsupported values, or timeouts. Arguments, receiver state, result, and
post-invocation state are structurally fingerprinted. A function-valued result
is conservatively unsupported unless the sample supplies a deterministic
`probeFingerprint` projection.

For a package-root input, `init` also considers concrete public `exports`
subpaths. The generated suite imports only subpaths selected by ranking/probe,
but authenticates each one before evaluation. Same-named exports do not
collide: the root keeps `hot`, while a subpath uses a visible ID such as
`./feature::hot`. These locators and all package names come from analysis;
core contains no React, Lodash, date-fns, Svelte, or Three.js registry.
