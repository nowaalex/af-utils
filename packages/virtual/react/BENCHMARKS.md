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

The unit suite additionally verifies stable bitmask subscriptions, StrictMode
lifecycle replay, React ref cleanup, and imperative `VirtualScrollerLayout`
updates without an initialization rerender.
