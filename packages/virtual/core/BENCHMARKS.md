# Virtual core performance checks

Run deterministic algorithm benchmarks with:

```bash
pnpm bench
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
pnpm --filter @af-utils/virtual-core bench:size-index-growth
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
pnpm --filter @af-utils/virtual-core bench:items:browser
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
pnpm --filter @af-utils/virtual-core bench:private
pnpm --filter @af-utils/virtual-core bench:private:browser
```

The dedicated runners publish the
[latest Node result](./scripts/benchmarks/private-fields/latest-node.md) and
[latest browser result](./scripts/benchmarks/private-fields/latest-browser.md)
beside the runner files.

The dedicated runner resets both variants to identical state, alternates their
execution order, runs garbage collection outside the timed blocks and reports
the median of 21 paired rounds. The Vitest suite also includes the same cases as
part of the complete `pnpm bench` run.

The browser command bundles only the fixture with esbuild in memory, then runs
the hot-loop comparison in headless Chromium, Firefox and WebKit. Run
`pnpm exec playwright install` first when the matching browser revisions are not
already installed. Browser construction timings are deliberately omitted
because timer quantization and garbage collection dominate such a short block;
the Node runner uses its high-resolution timer for that scenario. The browser
runner does not modify the library build; it only updates its latest Markdown
result.

The fixture checks both implementations for identical numeric results before
collecting Vitest timings. `pnpm jit:check` additionally verifies that all four
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

Run the V8 optimization smoke test with:

```bash
pnpm jit:check
```

It warms and explicitly optimizes `SizeIndex`, `VirtualScroller`, and
`VirtualScrollerLayout` hot paths. It verifies stable hidden classes after V8
construction slack tracking, then checks queries, item-count changes,
measurements, subscriptions, revisions, event dispatch, layout updates, and
mixed vertical/horizontal scroll synchronization. The command enables V8
deoptimization tracing, so regressions are visible in CI logs. This is
V8-specific and supplements browser traces.

The same command also fails when representative instances fall back to
dictionary properties, when internal JS arrays become sparse/dictionary arrays,
or when their V8 elements kind is wider than intended. It verifies:

- `PACKED_SMI_ELEMENTS` for event revisions;
- `PACKED_ELEMENTS` for subscription and element-reference arrays, including
  an empty subscription list after subscribe/unsubscribe;
- a packed numeric representation before and after a fractional sticky size
  forces the expected `SMI -> DOUBLE` transition;
- fixed, non-resizable `Float64Array`/`Uint8Array` buffers owned by `SizeIndex`;
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
pnpm --filter @af-utils/virtual-core jit:inspect
```

It adds V8 `%DebugPrint` output. This diagnostic is intentionally not parsed in
CI because the text format and native intrinsic set are not stable APIs and can
change with Node/V8 releases.

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
pnpm test:mutation
```

Stryker mutates the numeric storage, Fenwick tree, event dispatcher, scroll
activity, and sticky-element state. The regular unit suite is kept broad and
fast, while mutation testing is intended for CI or pre-release runs.
