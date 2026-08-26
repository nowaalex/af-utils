# React adapter performance checks

Run the React and core benchmark suites with:

```bash
pnpm nx run-many -t bench
```

`src/hooks/useVirtualSnapshot/index.bench.ts` compares the core numeric event revision
returned to `useSyncExternalStore` with the previous string snapshot, which
allocated on every read.

This microbenchmark isolates snapshot computation and must not be interpreted
as an end-to-end React render speedup; compare runs only on the same engine and
machine.

`src/components/List/index.bench.tsx` covers the adapter end to end in jsdom: a
cold mount and unmount of a 100k-item `VirtualList`, and repeated keyed
re-renders of the rendered range. Both suites run under CodSpeed CPU simulation
in the [Performance workflow](../../../.github/workflows/performance.yml), so
every pull request reports instruction-level deltas instead of wall-clock noise.

The unit suite additionally verifies stable bitmask subscriptions, StrictMode
lifecycle replay, React ref cleanup, and imperative `VirtualScrollerLayout`
updates without an initialization rerender.
