# Analyzer modules

> **Change Contract**
>
> - **Responsibility:** define how source resolution, parsing, provenance,
>   findings, obligations, probes, and suite generation compose.
> - **Boundary:** analyzer stages must prove source facts; they must not execute
>   target code or promote a static risk to a runtime failure.
> - **Invariants:** each fact has one owning stage, public reports expose no
>   competing internal model, and generated obligations retain exact owners.
> - **Configuration owners:** [model.ts](./model.ts),
>   [provenance.ts](./provenance.ts), and [rules/index.ts](./rules/index.ts).
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

The analyzer is a pipeline, not one collection of unrelated lint checks. Keep
each concern in the module that can prove it:

| Module                                    | Responsibility                                                                               | Must not do                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `model.ts`                                | Public report and option types                                                               | Parse source or execute targets                 |
| `ast.ts`                                  | Oxc node guards, traversal, and source locations                                             | Infer package exports or performance            |
| `resolution.ts`                           | Runtime-conditioned package/file resolution and public entries                               | Inspect function bodies                         |
| `graph/`                                  | ESM/CJS edge extraction, bounded traversal, and external package boundaries                  | Parse dependency packages as target code        |
| `source-integrity/`                       | Prove generated outputs cannot alter resolution before excluding them                        | Guess that an output filename is harmless       |
| `internal-model.ts`                       | Parsed-file and parameter-origin records shared between stages                               | Expose a second public API                      |
| `provenance.ts`                           | ESM/CJS public origins, exact owning functions, and `check-hot:` markers                     | Reconcile runtime targets by name alone         |
| `runtime-locations/*/`                    | Versioned, engine-specific coordinates derived from authenticated AST nodes                  | Widen a locator beyond its real-engine controls |
| `rules/syntax.ts`                         | Small expression/member classifications                                                      | Track aliases                                   |
| `rules/dataflow.ts` and `rules/dataflow/` | Scope-aware parameter, destructuring, alias origins, and binding-accurate write invalidation | Invent runtime inputs                           |
| `rules/index.ts`                          | One shared candidate traversal and feature dispatch                                          | Own problem-specific messages or metadata       |
| `rules/*/`                                | One problem's detector, catalog metadata, examples, remediation, and tests                   | Start a second AST traversal without proof need |
| `evidence.ts`                             | Stable source identities and measurable obligations                                          | Create obligations for advisory-only risks      |
| `probe.ts`                                | Fresh-process recipe discovery, repetition, hard timeouts, and terminal attempts             | Know React, Lodash, or another inspected API    |
| `generator.ts`                            | Portable low-code suite source                                                               | Execute the inspected module in the CLI process |
| `report.ts`                               | Human formatting and code frames                                                             | Change analysis results                         |

Package-tree hashing is shared runtime infrastructure behind the
`../source-identity.ts` facade, with its contract documented in
`../source-identity/README.md`; it is not a detector. It protects every feature
from stale resolution without duplicating file identity logic in individual
rules.

Structured `{ modulePath, exportPath }` identities are shared through
`../public-target/`; provenance emits them, evidence retains them, and runtime
workers resolve them. Do not re-encode or parse public subpath strings in an
analyzer rule.

Feature folders do not imply repeated parsing or traversal. `rules/index.ts`
constructs reusable scope/dataflow state and dispatches each visited node to the
small detectors. A feature may request a pre/post pass only when its proof needs
an aggregate (for example pushed element classes), and that exception belongs
in the feature rather than in the dispatcher.

## Adding a rule

1. Create `rules/<problem>/` with `README.md`, `detector.ts`, and
   `detector.test.ts`. Keep catalog metadata in `detector.ts`, next to the code
   that emits the rule.
2. Add one dispatcher call to `rules/index.ts`; use shared dataflow only when
   the result depends on a proven public argument origin.
3. Emit a factual message and a conditional remediation. For example,
   `return value + 1` may justify numeric representation experiments; it does
   not prove that `+` should be rewritten.
4. Mark `runtimeExperiment` in the feature definition only when core can construct semantically
   valid variants, identify the exact owning runtime function, hit the exact AST
   site for every variant after warmup, and verify observable behavior.
5. Add positive, shadowing/alias-kill, and unsupported tests beside the
   detector. A generic recipe
   name match cannot close an AST obligation.
6. Keep the feature README specific: risk example, proof boundary, runtime
   confirmation, and conditional remediation. General concepts stay in
   `../../docs/`.

The public index of all current rule families is in
[`docs/rules.md`](../../docs/rules.md); implementation-specific explanations
remain beside their detectors.
