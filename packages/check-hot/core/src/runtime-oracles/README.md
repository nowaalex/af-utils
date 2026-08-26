# Runtime oracle features

> **Change Contract**
>
> - **Responsibility:** register runtime oracle identities and expose their
>   supported evidence roles to the rest of core.
> - **Boundary:** the catalog must not implement an oracle or upgrade advisory
>   diagnostics into a primary pass/fail result.
> - **Invariants:** every oracle ID is unique and its role matches the owning
>   oracle module's proof boundary.
> - **Configuration owner:** [catalog.ts](./catalog.ts) owns registration.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

Runtime oracle folders own measured engine/process problem classes. A feature
contains `problem.ts`, a pure `check.ts`, colocated tests, and a README with the
proof boundary. Native intrinsics and public engine APIs remain in workers so
they execute against the exact runtime function.

Current features are V8 guarded deoptimization, V8 active-tier verification,
JavaScriptCore compilation stability, and worker liveness. The aggregate list
is `runtimeProblemDefinitions` in `catalog.ts`; the public all-layer list is
`problemDefinitions` in `../problems/catalog.ts`.
