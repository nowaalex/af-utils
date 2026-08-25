# Three.js check-hot audit

> **Change Contract**
>
> - **Responsibility:** keep one reproducible consumer audit of Three.js static
>   candidates and a target-scoped runtime proof.
> - **Boundary:** this folder records evidence; Three.js recipes remain in the
>   optional test-runner package and never move into core.
> - **Invariants:** portable summaries are committed, machine-specific suites
>   and raw artifacts are generated, and static findings remain hypotheses.
> - **Configuration owners:** the audit scripts and Three.js adapter own the
>   workload; generated artifacts own current measured results.
> - **Targeted check:**
>   `pnpm nx run @af-utils/check-hot-test-runners:test:threejs`.

This folder is a reproducible consumer audit, not part of `check-hot` core. It
keeps Three.js recipes in the optional test-runner package and separates:

- a package-root static analysis used to rank possible follow-up experiments;
- a real target-scoped V8 run for `three/src/math/MathUtils.js#lerp`;
- compact, portable JSON summaries and a human-readable report.

Refresh everything from the repository root:

```sh
pnpm nx run @af-utils/check-hot-test-runners:audit:threejs
pnpm nx run @af-utils/check-hot-test-runners:test:threejs
```

`audit:threejs` first rebuilds core and the external test-runner bundle, then
regenerates the suite, executes the measured workload, and refreshes both
reports.

The audit writes its generated suite and complete runtime JSON under
`.generated/`, which is intentionally not committed because it contains
machine-specific paths, commands, raw output, and an exact Node/V8 fingerprint.
The portable outputs are:

- [`REPORT.md`](./REPORT.md) — conclusions and prioritized advice;
- [`root-analysis.txt`](./root-analysis.txt) — concise native check-hot output;
- [`root-analysis.summary.json`](./root-analysis.summary.json) — root metrics,
  rule counts, diagnostics, and ranked candidates;
- [`runtime-summary.json`](./runtime-summary.json) — the exact measured target,
  tier, accepted domain, exclusions, and coverage result.

The root graph is intentionally incomplete when Three.js examples contain
nonliteral dynamic imports or CDN URLs. Static findings are hypotheses, not
proof that Three.js should be changed. The runtime section may recommend a code
change only when the selected target, semantic oracle, exact AST sites, and
engine oracle agree.
