# Runtime and engine oracles

Every matrix cell runs in a fresh process. Reports include the exact runtime,
engine, oracle ID/version, flags, suite adapter version, and reproducible
command.

| Runtime | Evidence                                                                                            | Meaning                                                                                      |
| ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Node.js | V8 active Maglev/TurboFan tier, optimization status, guarded deopt trace, representation intrinsics | Current requested tier and guarded-stress stability                                          |
| Deno    | The same versioned V8 oracle passed through Deno V8 flags                                           | Current requested tier and guarded-stress stability on Deno's V8 build                       |
| Bun     | `bun:jsc` DFG compile count, retry delta, compile time, descriptions                                | Historical optimized compilation and retry evidence; current tier is not publicly observable |

Deno exposes its exact runtime and V8 versions through
[`Deno.version`](https://docs.deno.com/api/deno/runtime/#variable_Deno_version)
and accepts V8 flags through
[`--v8-flags`](https://docs.deno.com/runtime/reference/cli/run/). Bun exposes
the JavaScriptCore counters used here through its official
[`bun:jsc` API](https://bun.sh/reference/bun/jsc). The worker feature-detects
every required capability because availability can still differ by runtime
build.

Maglev cells require active Maglev and TurboFan cells require active TurboFan;
“some optimized tier” is insufficient. Warmup deoptimizations are outside the
guarded trace interval. A guarded deoptimization remains a failure even if V8
later recompiles the function.

Bun's public JavaScriptCore interface does not expose a V8-equivalent current
tier status. The result therefore reports `compiledHistorically` and
`currentTier: not-observable`, not `optimized: true`.

V8 tier intrinsics and the JSC diagnostic module are checked before measurement.
Unknown flags or intrinsics produce an explicit unsupported outcome. Generated
AST mutations additionally use a disposable semantic/representation preflight;
Node proves exact JavaScript AST-site reachability with Inspector precise
coverage. TypeScript source is executable through the bundled `tsx` loader, but
exact-site obligations remain blocked; source-map transport is deliberately
postponed. The current Deno/Bun implementation also blocks that class of
obligation rather than claiming unobservable coverage. A per-cell timeout covers
both preflight and measurement processes.

Runtime resolution is an oracle boundary too. CI creates packages whose
`exports` conditions, `import`/`require` branches, legacy `main`/`module`
fallbacks, public subpaths, and Bun extension priorities deliberately diverge.
It compares analyzer-selected artifacts with the actual runtime's
`import.meta.resolve`, `import()`, and `createRequire()` results. Required
runtimes cannot turn those controls into skipped tests. The modeled condition
sets follow the official [Node package contract](https://nodejs.org/api/packages.html#conditional-exports),
[Deno npm compatibility contract](https://docs.deno.com/runtime/fundamentals/node/#control-package-export-conditions),
and [Bun module-resolution contract](https://bun.sh/docs/runtime/module-resolution).

Combined runs expose interactions among scenarios. Isolated runs identify one
responsible family and start with fresh state. Repetitions detect unstable
tiering or scheduling.

## Optional diagnostic reruns

`--diagnostics v8-ic-maps,cpu-profile,jsc-sampling` starts separate workers
only after every primary matrix cell has finished. V8 diagnostics retain a version-pinned raw log
and normalize inline-cache histories plus connected Map transitions. Analyzer-
generated suites prefer an exact authenticated V8 code-creation locator;
manual targets without one can use unique-name correlation, which is reported
at lower precision. CPU profiles rank observed functions but report zero samples as
unobserved. Bun sampling reports LLInt/Baseline/DFG/FTL sample distribution
without claiming a currently attached JSC tier.

These collectors never affect primary pass/fail or obligation coverage. Missing
capabilities, changed log formats, oversized artifacts, and diagnostic worker
failures are explicit advisory gaps. Map/function-name correlation is not an
exact source-site proof, and source maps remain outside this release.

Programmatic callers can set `diagnosticStressIterations` per collector. This
is intentionally separate from the primary `stressIterations`: an IC/Map log
usually needs a short focused run to stay bounded, while statistical CPU
sampling needs a longer run to observe a small public function through process
startup noise. The selected budget is recorded in that diagnostic worker's
command and event stream.

Each diagnostic starts a fresh process and repeats setup plus the selected
scenarios. Its JavaScript heap is isolated, but external I/O is not rolled back:
files, databases, services, and other processes may see the workload again.
Use idempotent fixtures or sandboxed external resources when diagnostics are
enabled.
