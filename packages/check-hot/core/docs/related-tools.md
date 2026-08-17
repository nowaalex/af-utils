# Related tools and design boundaries

Check-hot combines ideas from existing diagnostics without trying to replace
their complete product surface.

## Ideas adopted

- [V8 Deopt Explorer](https://github.com/microsoft/deoptexplorer-vscode) and
  [Deoptigate](https://github.com/thlorenz/deoptigate) demonstrate the value of
  connecting deoptimizations, inline-cache evolution, functions, and V8 Maps
  back to source. Check-hot adopts that **deep-graph idea**: its optional V8
  diagnostic builds a bounded, target-connected IC/Map graph and keeps the raw
  version-pinned log. Unlike an editor explorer, this graph is attached to a
  repeatable suite run and never changes the primary pass/fail verdict.
- [0x](https://github.com/davidmarkclements/0x) and
  [Clinic.js](https://github.com/clinicjs/node-clinic) show why profiling output
  must first identify actual hot work and then guide a narrower investigation.
  Check-hot therefore correlates whole-diagnostic-process CPU samples only with
  authenticated JavaScript owners and reports unsampled candidates as
  unobserved. It does not claim to provide flamegraphs, event-loop diagnosis,
  async-operation graphs, or production performance regression thresholds.
- [StrykerJS](https://stryker-mutator.io/docs/stryker-js/introduction/) mutates
  check-hot itself to test whether its deterministic tests detect injected
  implementation errors. This is separate from check-hot's runtime input
  mutations, which exercise representation and shape transitions in an
  inspected library.
- [Oxc Parser](https://oxc.rs/docs/guide/usage/parser) supplies the JS, JSX, TS,
  and TSX AST. Check-hot adds package/runtime resolution, binding provenance,
  experiment planning, and engine evidence; it does not reimplement the Oxc
  parser or AST stack.

## Explicit non-goals for the alpha MVP

- Check-hot is not a formatter or linter and does not replace
  [Biome](https://biomejs.dev/) or Oxlint. Static findings are hypotheses used
  to plan runtime experiments, not universal style errors.
- It does not recreate Turbolizer/compiler-IR visualization, the Deopt Explorer
  VS Code UI, or a full application profiler.
- Source-map correlation is intentionally deferred. Exact-site runtime proof is
  accepted only when analyzer and runtime offsets refer to authenticated,
  untransformed JavaScript bytes.
- A performance-regression lane with timing thresholds is intentionally
  deferred. CPU sampling ranks investigation candidates; it is not a benchmark
  or a speed score.

These boundaries matter because ordinary polymorphism, Map transitions, a cold
function, or an unsampled tier can be intentional. Check-hot reports those as
measured advisory evidence or an explicit gap unless an independent primary
oracle proves a guarded optimization failure.
