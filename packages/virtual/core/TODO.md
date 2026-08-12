# TODO

## Cache derived model reads

Investigate caching expensive derived getters in `VirtualScroller`. The cache
must live in core so React, Solid, the framework-neutral layout adapter, and
custom consumers share the same work instead of memoizing it independently.

Start with the hot geometry reads:

- Cache `renderedRangeSize`, or expose one internal no-allocation operation
  that fills both rendered-range size and offset. `VirtualScrollerLayout`
  currently reads `renderedRangeSize` and `renderedRangeOffset` separately, so
  it repeats `SizeIndex` prefix-sum traversals for the same `from` and `to`.
- Evaluate `visibleFrom`, `_exactFrom`, and `_exactTo`. Prefer reusing values
  within one range synchronization when their lifetime is shorter than a full
  model revision; do not add a durable cache where a local snapshot is enough.
- Audit the remaining getters, but do not cache trivial field reads. Cache only
  measured hot paths whose derivation is more expensive than validating the
  cache.

Before caching `renderedRangeOffset` or `visibleFrom`, remove or explicitly
model their dependency on live adapter state. Both can currently reach
`_isAtPublishedEnd`, which calls `_readOffset()`. A cached getter must be a pure
derivation of captured model state; reading it must not trigger layout, and a
DOM value changing without a model mutation must not make its cache stale.

Define invalidation from dependencies rather than public event flags:

- Rendered range size depends on `from`, `to`, and relevant `SizeIndex`
  prefixes.
- Rendered range offset additionally depends on the published `scrollSize` and
  end-anchoring state.
- Visible position additionally depends on aligned scroll position, available
  viewport size, sticky sizes, and the containing item's measured size.
- Invalidate or advance a geometry epoch before synchronous subscribers run.
  Public events alone are not a sufficient cache key because several source
  mutations can be coalesced into one event batch.

Keep the hot path allocation-free and preserve the public getters' current
semantics and validation. Do not expose a mutable internal cache as public API.
If an atomic public snapshot is added later, make its ownership and allocation
cost explicit.

Validate the design before adopting it:

- Add benchmarks for cache hits and misses at small and large item counts,
  including a layout update that reads range size and offset together.
- Cover every invalidation source: scrolling without a range change, range
  changes, item measurements, invalidation, estimate changes, splice/count
  changes, viewport and sticky measurements, and deferred end publication.
- Run JIT checks to ensure the cache keeps stable object shapes and does not
  make uncached mutations slower enough to erase the read-side gain.
- Confirm with a browser trace that cached reads use model memory only and
  introduce no forced layout, style recalculation, or paint.
