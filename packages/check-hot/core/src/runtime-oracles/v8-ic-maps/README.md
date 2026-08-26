# V8 inline-cache and Map graph

> **Change Contract**
>
> - **Responsibility:** collect and correlate bounded V8 IC/Map diagnostics with
>   authenticated target code and source locations.
> - **Boundary:** unstable log records, names, or Map transitions must not change
>   the primary verdict or claim exact source identity without proof.
> - **Invariants:** unsupported fingerprints preserve raw evidence as a gap,
>   compatibility is admitted only with real-engine controls, and byte caps hold.
> - **Configuration owners:** [parse.ts](./parse.ts) owns compatibility and
>   parsing; [check.ts](./check.ts) owns diagnostic evaluation.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

This optional oracle performs a separate diagnostic rerun with V8's `--log-ic`,
`--log-maps`, and `--log-maps-details` flags. It never changes the primary
tier, deoptimization, coverage, or pass/fail result. The exact V8 version and
complete raw log are retained because this protocol is unstable.

## Risk example

```js
function read(point) {
    return point.x;
}

read({ x: 1 });
read({ x: 1, optional: true });
```

The second shape can move the load IC from monomorphic to polymorphic. That is
diagnostic evidence, not proof that the API should reject the shape.

## Possible improvement

```js
const point = { x: 1, optional: undefined };
```

Initialize fields consistently only when the graph, isolated scenario, and real
API semantics show that the transition is responsible for a harmful hot-path
change.

## Proof boundary

Map addresses are normalized to stream-local IDs. Source line/column values and
function names from the log are not exact analyzer-site identities. A target is
source-correlated only when the code-creation record matches the authenticated,
untransformed file and the analyzer-derived V8 locator: the parameter-list
opening, bare-arrow parameter, or async-arrow keyword required by that syntax.
The locator also carries its schema, syntax/modifier tuple, and complete source
SHA-256. Body containment and path suffixes are not accepted. A unique runtime
name is reported only as name correlation. An IC program counter inside that
matched code range is target correlation; the IC record's own line/column is
still not claimed as an exact analyzer-site identity.

Parser layout `1` is enabled only for tightly scoped fingerprints backed by
required real-engine controls. The executable
[compatibility registry](./parse.ts) owns the exact runtime, engine, platform,
and control-job values. Other platforms remain a diagnostic locator gap until
their path and source-coordinate behavior is controlled. The log header must
still equal the active runtime's complete V8 version. Any other fingerprint, a
mismatched header, or a changed log format produces a diagnostic gap and
preserves the raw file without normalized IC advice. This never becomes a
target-code failure. New fingerprints must be admitted with a persisted or
CI-required real-engine fixture/control rather than by assuming that the
unstable CSV layout is unchanged.

Raw logs can be large. Collection enforces a configurable byte cap, then reads
the complete bounded file into memory. Parsing iterates that string without
allocating a second full line array and materializes Map details only for the
target-connected subgraph. It is not a streaming parser.
