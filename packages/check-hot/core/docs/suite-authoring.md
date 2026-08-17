# Suite authoring

Automatic AST mutations still need at least one semantically valid seed for APIs
whose inputs cannot be inferred safely. Seeds can be explicit or provided by a
separately installed test runner.

```ts
import { defineHotSuite, defineHotTarget } from "@af-utils/check-hot";
import { Cache } from "../src/cache.js";

interface State {
    cache: Cache;
}

const cacheGet = defineHotTarget<State>(
    "Cache.get",
    state => Object.getPrototypeOf(state.cache).get
);

export default defineHotSuite<State>({
    name: "my-cache",
    setup: () => ({ cache: new Cache(256) }),
    scenarios: [
        {
            id: "hit-and-miss",
            targets: [cacheGet],
            run({ state, iteration, invoke }) {
                invoke(cacheGet, state.cache, [iteration & 255]);
            }
        }
    ],
    annotations: {
        roots: ["../src"],
        relativeTo: "suite"
    }
});
```

`defineHotTarget` declares the ID and resolver once. Direct targets use
`context.invoke`, which lets the worker prove they were reached in warmup and
stress. A manually declared genuinely nested target may set
`requireInvocation: false`; use this only when its enclosing direct target and
engine evidence prove the intended call chain.

## Source markers

```ts
// check-hot: Cache.get
get(key: number) {
    // ...
}
```

Markers are language-independent coverage links, not input recipes. The scanner
fails stale, duplicate, or missing declarations. Generated/per-instance targets
may explicitly opt out.

For a large hand-authored suite, markers can also generate the target catalog at
build time. Import `discoverHotAnnotations` and `hotAnnotationTargetAlias` from
`@af-utils/check-hot/annotations`, require every JS/TS marker to have
`location.owner === location.id`, and emit ordinary `defineHotTarget` calls into
a temporary generated module. The suite then needs only a map from owner names
to representative state objects. Keep this generation out of runtime workers:
the annotations subpath is Node/Oxc build tooling, while the generated target
module is plain portable JavaScript. Reject detached owners and alias collisions
instead of silently selecting one.

## External seed providers

```sh
pnpm add --save-dev \
  @af-utils/check-hot \
  @af-utils/check-hot-test-runners

check-hot init my-library \
  --probe \
  --probe-runtime node \
  --test-runner @af-utils/check-hot-test-runners/generic \
  --out check-hot.suite.mjs
```

Every probe attempt is time-limited and disposable but cannot undo external
I/O. Core runs each coordinate twice in two fresh processes and continues after
a throw, hard timeout, unsupported fingerprint, or nondeterministic result. Its
manifest records every attempted label for each included function, lifecycle
stage, and exact package, runner, runtime, and engine versions. A manifest is
replayed only on that exact runtime/engine fingerprint; probe Node, Deno, and
Bun separately when all three are requested. Dynamic workers revalidate package
and runner compatibility before replay.

A seed provider may declare per-invocation `before`, `after`, and `verify`
callbacks plus per-sample iteration budgets. If the result contains an opaque
function/closure, `probeFingerprint({ result, args, receiver })` must project it
to deterministic data that core can compare without guessing captured state.
Stateful setup/teardown for an entire workload belongs in an explicit suite.
Renderers, DOM fixtures, and compiler lifecycles belong in an external adapter
workspace; process orchestration stays in core.

Use `acceptMutation({ args, variant, ... })` only to declare the documented
input domain of core-generated variants. Return `true` to accept or a bounded
reason string to exclude. Exclusions remain visible in the mutation plan and do
not count as coverage; `verifyMutation` is still mandatory for every accepted
variant.
