# Virtual core performance checks

Run deterministic algorithm benchmarks with:

```bash
pnpm nx run-many -t bench
```

The suite separates:

- `SizeIndex` prefix-sum queries, batched measurements and capacity growth;
- `VirtualScroller` facade queries and range synchronization;
- `VirtualScrollerLayout` imperative style synchronization;
- named axis adapters versus the former computed-property implementation;
- numeric event dispatch and per-instance batching;
- native-scroll lifecycle and sticky-element measurement transitions;
- range mapping with and without offsets.

Compare results from the same machine, Node version and power profile. CI
timings are for regression detection, not absolute cross-machine claims.

Dedicated benchmark runners publish their latest results as Markdown instead
of leaving them only in terminal output.

## SizeIndex capacity growth

The [latest result](./scripts/benchmarks/size-index-growth/latest.md) compares
fixed-array allocation and copy, the currently used
`ArrayBuffer.prototype.transferToFixedLength`, and resizable-buffer `resize`.
It isolates growing the `_sizes` typed array, preserving existing values and
initializing its newly added tail. Fenwick-tree work is deliberately excluded.

Regenerate the Node, Chromium, Firefox, and WebKit results with:

```bash
pnpm nx run @af-utils/virtual-core:bench:size-index-growth
```

The runner rotates strategy order, validates identical output, takes the median
after warmup, and writes the environment metadata and result tables directly to
`scripts/benchmarks/size-index-growth/latest.md` beside the runner and fixture.

## Item registration

The browser runner compares explicit refs backed by a `WeakMap` with
`MutationObserver` discovery using row and column attributes. Its
[latest result](./scripts/benchmarks/item-registration/latest.md) covers
Chromium, Firefox, and WebKit.

Run it with:

```bash
pnpm nx run @af-utils/virtual-core:bench:items:browser
```

## TypeScript `private` versus native `#private`

`src/benchmarks/privateFields.bench.ts` compares TypeScript `private` fields,
which become ordinary JavaScript properties at runtime, with native ECMAScript
`#private` fields. Both fixtures have the same eight-field numeric state and
identical operations. The suite measures:

- 100,000 mixed reads and writes inside one monomorphic hot method;
- 100,000 calls distributed over eight same-class instances;
- construction of 1,000 eight-field instances.

Run only this comparison with:

```bash
pnpm nx run @af-utils/virtual-core:bench:private
pnpm nx run @af-utils/virtual-core:bench:private:browser
```

The dedicated runners publish the
[latest Node result](./scripts/benchmarks/private-fields/latest-node.md) and
[latest browser result](./scripts/benchmarks/private-fields/latest-browser.md)
beside the runner files.

The dedicated runner resets both variants to identical state, alternates their
execution order, runs garbage collection outside the timed blocks and reports
the median of 21 paired rounds. The Vitest suite also includes the same cases as
part of the complete `pnpm nx run-many -t bench` run.

The browser command bundles only the fixture with esbuild in memory, then runs
the hot-loop comparison in headless Chromium, Firefox and WebKit. Run
`pnpm exec playwright install` first when the matching browser revisions are not
already installed. Browser construction timings are deliberately omitted
because timer quantization and garbage collection dominate such a short block;
the Node runner uses its high-resolution timer for that scenario. The browser
runner does not modify the library build; it only updates its latest Markdown
result.

The fixture checks both implementations for identical numeric results before
collecting Vitest timings. `pnpm nx run @af-utils/virtual-core:jit:check`
additionally verifies that all four
hot methods are optimized by V8, both instance kinds keep stable maps and
neither falls back to dictionary properties. This is a runtime comparison only:
it does not invoke Rolldown or compare generated-code size.

## Axis adapter benchmark

`src/platform/scrollerAdapters/index.bench.ts` runs the four real modes (vertical and
horizontal, element and window) in one mixed call site. It compares the current
named reads with the previous `target[this._scrollKey]` approach. The mixed
case matters: a single computed-property load receives four property names,
while each axis function retains a static named load that V8 can optimize
independently.

Treat the local ratio as a regression baseline rather than a universal browser
constant; property-access microbenchmarks vary substantially between V8 releases.

Run the regular hot-path optimization gate with:

```bash
pnpm nx run @af-utils/virtual-core:jit:check
```

The package uses [`@af-utils/check-hot`](../../check-hot/README.md) with two
complementary checks. A production-like minified bundle contains the broad
manual suite and the library. This ensures `SizeIndex` is the same constructor
used inside `VirtualScroller` and ensures private-property mangling matches the
published build. The regular gate runs all scenarios together on
Node/TurboFan.

The build also emits an immutable `.jit/ast-targets.mjs`, analyzes those exact
JavaScript bytes, and writes a generated `.jit/ast-plan.mjs`. The second suite
uses the thick core mutation lifecycle to close every generated obligation:
fresh semantic receivers, args-aware result verification, exact Inspector
block hits for every numeric representation, guarded-stress replay, and the
final optimization oracle. This is deliberately separate from source-map work:
Oxc offsets and V8 coverage offsets refer to the same executed minified file,
so TypeScript transformation cannot create false site matches. The current
non-vacuous control covers both ordinary TypeScript-private fields and native
ECMAScript private fields; the build fails if either target no longer maps to a
unique analyzed function or produces no numeric evidence.

The `check-hot:` source comments are the single source of truth for 28 ordinary
prototype targets. `scripts/v8/build.mjs` uses Oxc-backed annotation discovery
to bind each marker to its exact method and generates `.jit/annotated-targets.mjs`.
The suite provides only one representative owner instance per class. Two layout
targets remain explicit because they intentionally bind the same implementation
to different vertical/horizontal state. Scenarios reference target objects, so
method IDs and resolver functions are no longer copied into `suite.mjs`.

The repeatable scenarios cover `SizeIndex` boundaries and fractional values,
all four axis/scroller modes and both directions, 64-entry measurements with
zero and stale entries, immediate/nested/reentrant events, native and fallback
scroll activity, sticky header/footer measurements, vertical/horizontal layout,
element/window adapters, and TypeScript/native private fields. V8 trace
sentinels limit failures to guarded stress, so harmless warmup tier transitions
are not reported as regressions.

Run the larger Node+Deno, Maglev+TurboFan, combined+isolated matrix twice with:

```bash
pnpm nx run @af-utils/virtual-core:jit:check:full
```

Run the JavaScriptCore adapter separately on a machine with Bun installed:

```bash
pnpm nx run @af-utils/virtual-core:jit:check:bun
```

Deno exposes the same V8 status, map, representation, and guarded-deopt probes.
Bun uses JavaScriptCore instead: its adapter checks DFG compilation and
reoptimization retry counts without pretending those are V8 maps or TurboFan
statuses.

The same command also fails when representative instances fall back to
dictionary properties, when internal JS arrays become sparse/dictionary arrays,
or when their V8 elements kind is wider than intended. It verifies:

- `PACKED_SMI_ELEMENTS` for event revisions;
- `PACKED_ELEMENTS` for subscription and element-reference arrays, including
  an empty subscription list after subscribe/unsubscribe;
- a packed numeric representation before and after a fractional sticky size
  forces the expected `SMI -> DOUBLE` transition;
- two fixed, non-resizable `Float64Array` buffers owned by `SizeIndex`;
- SMI counters and indexes alongside finite double size/offset paths;
- fast properties and compatible hidden classes for axis, element-scroller,
  window-scroller, model, index, and layout objects.

`WeakMap` remains an intentional hash-backed collection for item element
indexes; the representation check distinguishes it from an accidental
dictionary-mode plain object. Typed arrays have their own specialized V8
elements kinds, so `%HasFastElements` (which is for ordinary JS arrays) is
deliberately not used for them.

For a human-readable dump of in-object fields, hidden classes, backing stores,
and exact typed-array elements kinds, run:

```bash
pnpm nx run @af-utils/virtual-core:jit:inspect
```

It adds V8 `%DebugPrint` output. The normal report reduces trace entries to the
function and deoptimization reason while machine-readable JSON and `--verbose`
retain raw lines. `%DebugPrint` itself remains human-only because its text format
and native intrinsic set can change with Node/V8 releases.

## Events and batching

`src/models/VirtualScroller/events/index.bench.ts` compares the current
bit-flag, subscription-array event dispatch with a string-based `EventTarget`,
then measures coalescing repeated event flags. Numeric IDs are an internal
dispatch optimization; the exported named constants preserve readable consumer
code.

The same suite compares `Set.add` with `Array.includes` plus `push` along two
axes: 1–64 unique callbacks encountered eight times, and 1–64 repeated events
with three unique callbacks. This isolates the callback-deduplication crossover
even though the production dispatcher now avoids both approaches: it ORs three
event flags during a batch and scans each subscription exactly once when the
outer batch ends. On the current Node/V8 baseline, event count alone has no
monotonic crossover; with three callbacks the two approaches remain close and
the array tends to win from eight repeated events. Unique callback count is the
important dimension: arrays are preferable for one or two, results below 16
are close enough to treat as noise, `Set` becomes consistently faster around
16, and is decisively faster by 32. Re-measure after a Node/V8 upgrade.

The revision comparison exercises a write and a selected-mask read together.
Keeping the latest global revision per event is about 4.8 times faster on the
current baseline than eagerly updating all seven possible mask revisions to
make reads a single array lookup. This matches the library workload: publishing
scroll changes is hotter than reading a React external-store snapshot.

`src/models/VirtualScroller/scrollActivity/index.bench.ts` measures native and
fallback scroll-state transitions with a deterministic scheduler. It also
compares independent boolean fields with the production SMI bitmask using the
same setter/getter transition pattern.
`src/models/VirtualScroller/stickyElements/index.bench.ts` measures two-element
`ResizeObserver` deliveries. Construction is intentionally outside the timed
blocks: these checks protect hot transitions, not model allocation cost.

Run mutation testing with:

```bash
pnpm nx run @af-utils/virtual-core:test:mutation
```

Stryker mutates the numeric storage, Fenwick tree, event dispatcher, scroll
activity, and sticky-element state. The regular unit suite is kept broad and
fast, while mutation testing is intended for CI or pre-release runs.
