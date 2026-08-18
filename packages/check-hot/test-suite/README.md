# @af-utils/check-hot-test-runners

Optional, version-aware ecosystem recipes for `@af-utils/check-hot`. This is a
separate package so the orchestration core contains no React, Svelte, Lodash,
date-fns, or other checked-library behavior.

Those libraries appear as optional peer dependencies in this package's
`package.json`; consumers install only the ecosystems they inspect. They also
appear as development dependencies so this workspace runs real integration
probes instead of claiming compatibility from synthetic stand-ins alone.

```sh
pnpm add --save-dev @af-utils/check-hot @af-utils/check-hot-test-runners
check-hot init lodash \
  --probe \
  --function head \
  --probe-runtime node \
  --test-runner @af-utils/check-hot-test-runners/lodash \
  --out check-hot.node.mjs
```

The generated suite pins the exact test-runner version, target package version,
probe runtime, and engine version. A manifest is replayed only by that exact
runtime/engine fingerprint. Every actual Node, Deno, or Bun worker also checks
the runner's supported version ranges before executing samples. A stale
manifest, runner upgrade, package upgrade, or unsupported runtime fails
explicitly and requires a fresh probe or runner update.

Published runner entrypoints are bundled and build-checked to contain no
external runtime imports. That keeps helpers such as `semver` and shared recipe
logic inside the source graph authenticated by the probe manifest. Source
modules remain DRY; bundling is a distribution/integrity boundary, not a copy of
ecosystem logic into core.

This release declares policy for Node `>=20.19 <21 || >=22.12 <28`, Deno `>=2 <3`, and Bun
`>=1.2 <2`.
Package adapters additionally require Lodash `>=4 <5`, date-fns `>=3 <5`,
React `>=18 <20`, or Svelte `>=5 <6`. These ranges are executable policy in
`validate`; they are not a claim that every patch in the interval has been run
in this repository. The installed workspace versions are exercised by real
probe/replay tests and CI runs engine-oracle controls on Node, Deno, and Bun.
Engine versions are recorded when the runtime exposes them; a Bun report shows
`jsc@unknown` when its active build does not provide a separate JavaScriptCore
version string.

Workspace integration tests do not manufacture accepted manifests. Core probes
one representative export from every installed ecosystem in repeated fresh
processes and then runs the accepted recipe in a real V8 worker. Lodash,
date-fns, React, Svelte compiler, and the narrow Three.js MathUtils module run
the complete `analyze → obligations → generated suite → worker ledger` path.
Selected obligations must reach exact source evidence with mutation-aware
verification; a clean pass and a separately proven V8 tier mismatch are kept as
different outcomes. Exact expected tier outcomes are asserted only for recorded
Node/V8 fingerprints, because a compiler change is not an adapter truth.
User-excluded obligations remain `ignored` and may never be relabelled as
missing coverage. Svelte's current external dependency boundary must stay an
explicit incomplete-graph problem even while the selected `compile` obligation
is exercised. React also requires target-scoped IC evidence and at least one
authenticated whole-process CPU sample for `createElement`; an arbitrary
diagnostic crash/gap cannot make the integration green.

Available entrypoints are `auto`, `generic`, `lodash`, `date-fns`, `react`,
`svelte`, and `three`. `auto` selects in this package, never in `check-hot`
core. React covers safe public helpers, including functions nested under its
public `Children` object, rather than hooks or reconciliation. Svelte covers
compiler exports rather than DOM lifecycle. Three.js covers deterministic
numeric `MathUtils` operations without constructing a renderer or requiring
DOM/WebGL. Adapters return structured public locators for nested functions;
core, not the adapter, resolves the callable and receiver. Richer cases belong
in additional fixture runners with renderers, DOM setup, production bundles,
and teardown.

For Three.js, prefer the narrow public module that owns the workload, for
example `three/src/math/MathUtils.js`. The package-root export map also exposes
the complete examples tree, including browser-only CDN imports and dynamic
physics loaders. A root analysis deliberately reports those unresolved edges as
an incomplete graph rather than silently treating every example as covered.
Set `CHECK_HOT_HEAVY_ECOSYSTEM=1` to include that intentionally expensive root
audit in this package's test suite. The ordinary correctness gate uses the
public `MathUtils` subpath and does not turn the heavy scan into a performance
test.

A reproducible checked-in audit and its report live in
[`threejs/`](./threejs/README.md).
`pnpm nx run @af-utils/check-hot-test-runners:audit:threejs` refreshes the compact
root analysis and the target-scoped `MathUtils.lerp` runtime proof without
placing Three.js behavior in core.

```sh
check-hot init three/src/math/MathUtils.js \
  --probe \
  --function lerp \
  --probe-runtime node \
  --test-runner @af-utils/check-hot-test-runners/three \
  --out check-hot.three.node.mjs
```

## Custom runner

Use `createRecipeTestRunner` to keep package/runtime policy beside samples:

```ts
import { createRecipeTestRunner } from "@af-utils/check-hot-test-runners";

export default createRecipeTestRunner({
    id: "my-library",
    version: "1.0.0",
    packageNames: ["my-library"],
    packageRange: ">=3 <4",
    runtimeRanges: {
        node: ">=22 <28",
        deno: ">=2 <3",
        bun: ">=1.2 <2"
    },
    resolve(candidate) {
        if (candidate.name !== "transform") return [];
        return [
            {
                label: "objects-and-stable-callback",
                args: () => [
                    [{ value: 1 }, { value: 2 }],
                    (item: { value: number }) => item.value
                ],
                verify(result) {
                    if (!Array.isArray(result)) {
                        throw new TypeError("transform must return an array");
                    }
                }
            }
        ];
    }
});
```

Adapters do not execute probes. They declaratively list recipe labels and
recreate their samples; thick core owns invocation, two fresh-process repeats,
hard timeouts, semantic fingerprints, and terminal accounting. Recipes may be
synchronous or asynchronous. A synchronous infinite loop kills only its own
attempt process, and later coordinates continue. Probe processes cannot undo
external I/O. Review generated scenarios and use explicit core samples for
stateful APIs, invalid inputs, lifecycle ordering, and semantic assertions.

Use `verify` for ordinary recipe assertions. An automatic AST obligation also
requires `verifyMutation({ result, args, receiver, variant, ... })`, because the
core-mutated arguments cannot be checked by a result-only callback. Function-valued or otherwise opaque
results also need `probeFingerprint` that returns stable inspectable data, for
example `({ result }) => result({ value: 1 })`; core will not compare closures
only by their source text.

When an engine variant is outside an API's documented domain, add
`acceptMutation` and return a concrete exclusion reason. Do not weaken
`verifyMutation` or silently coerce the value. Core records the exact accepted
and excluded partition, replays only accepted inputs, and requires a real
representation transition inside that accepted domain.

A generic name-based recipe is only a semantic seed. `createRecipeTestRunner`
has `coveragePolicy: "seed-only"` and cannot close an AST obligation by itself.
Core may derive an exact argument mutation from proven parameter flow and
preflight it against that seed. Exact manual `covers` claims use an
analyzer-issued `obligationId` plus the matching family and belong in an explicit
generated/user suite, not a reusable name heuristic. Thrown, timed-out,
unsupported, and nondeterministic probe attempts remain in the manifest.
