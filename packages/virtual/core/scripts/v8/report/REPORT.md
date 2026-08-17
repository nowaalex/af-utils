# `@af-utils/virtual-core` check-hot report

## Verdict

Runtime: `node@26.7.0 / v8@14.6.202.34-node.28`, requested tier:
`turbofan`.

| Suite                           | Scenarios | Result | Coverage          |
| ------------------------------- | --------: | ------ | ----------------- |
| Domain-specific virtual-core    |         9 | PASS   | complete          |
| Automatically derived AST suite |        18 | PASS   | 35/35 obligations |

The package-level static graph is complete: 16 files, 208 function candidates,
146 risk hypotheses, 35 runtime obligations, and no unresolved external edge.

No source replacement is justified by this run. Every selected target retained
the requested tier, guarded stress produced no failing target deoptimization,
and the obligation ledger is complete.

## Follow-up recommendations

These are static hypotheses worth preserving as regression scenarios, not
confirmed defects.

### `VirtualScroller._applyMeasurements`

Location:
[`src/models/VirtualScroller/index.ts:639`](../../../src/models/VirtualScroller/index.ts#L639)

The analyzer sees `entries.length` as an ambiguous receiver because static
JavaScript syntax alone does not distinguish arrays, strings, and array-like
objects. TypeScript declares `readonly ResizeObserverEntry[]`, and the runtime
suite passes. No rewrite is recommended. Keep scenarios for empty and populated
entry lists.

### `SizeIndex._getIndex` and `_getOffset`

Locations:
[`_getIndex`](../../../src/models/SizeIndex/index.ts#L335) and
[`_getOffset`](../../../src/models/SizeIndex/index.ts#L314).

The Fenwick search combines numeric representation changes with indexed typed
array access inside a loop. Current runtime coverage passes. Keep the logical
`candidate <= this._count` guard: it prevents typed-array out-of-bounds reads
that can deoptimize V8 even when the numerical result would be unchanged.

Recommended regression inputs:

- zero and negative offsets;
- exact item boundaries;
- non-power-of-two counts;
- SMI and fractional sizes;
- capacity larger than the logical item count.

### `SizeIndex._updateSize`

Location:
[`src/models/SizeIndex/index.ts:403`](../../../src/models/SizeIndex/index.ts#L403)

The analyzer reports dynamic indexed access and numeric transitions. The
existing bounds, finite-value, and zero-delta guards already constrain the
domain, and the runtime suite passes. Do not normalize every value merely to
satisfy the static finding. Continue testing fractional sizes, zero delta, and
invalid indices.

### `StickyElements._applyResizeEntries`

Location:
[`src/models/VirtualScroller/stickyElements/index.ts:115`](../../../src/models/VirtualScroller/stickyElements/index.ts#L115)

The loop indexes `_sizes` dynamically. No harmful transition was observed. Keep
the `_elements` and `_sizes` collections aligned and constructed consistently;
only consider restructuring if future IC/Map evidence identifies instability at
this exact path.

### `VirtualScrollerEvents._notify`, `_emit`, and `_endBatch`

Locations:
[`_notify`](../../../src/models/VirtualScroller/events/index.ts#L185),
[`_emit`](../../../src/models/VirtualScroller/events/index.ts#L119), and
[`_endBatch`](../../../src/models/VirtualScroller/events/index.ts#L142).

The analyzer highlights array indexing, revision indexing, and numeric bitmask
operations. The original CI deoptimizations in this area did not reproduce in
the current guarded suite: all targets finished at TurboFan and coverage passed.
No callback-loop or event-mask rewrite is currently supported by runtime
evidence. Preserve scenarios with multiple subscription counts, event masks,
batch nesting, and callbacks that unsubscribe during notification.

## Reproduction

From the repository root:

```sh
pnpm --filter @af-utils/virtual-core test:v8
```

For verbose representation diagnostics:

```sh
pnpm --filter @af-utils/virtual-core jit:inspect
```

Static findings are hypotheses. A future change should be recommended only when
the semantic scenario, exact target, guarded phase, and engine evidence agree.
