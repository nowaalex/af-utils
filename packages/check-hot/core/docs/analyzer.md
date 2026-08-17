# Analyzer, mutations, and coverage

For concrete source examples and conditional remediations, see
[Problems, experiments, and possible fixes](./rules.md).

`check-hot analyze` never imports the target. It starts from the runtime-selected
public package entry and follows a condition-aware local module graph. For a
package root it also resolves every exact JS/TS exports subpath and expands
filesystem-backed wildcard subpaths. A pattern that cannot be enumerated, an
unresolved edge, or `maxFiles` truncation is a diagnostic and makes the graph
incomplete.

Generated suites keep the original public package request and concrete public
subpath requests. Inside each fresh worker, native `import.meta.resolve` must
select the same package-relative artifact and source SHA for every selected
entry as the analyzer. Before importing targets, core also authenticates
every parsed package-local graph file and a conservative tree of JS/TS/runtime assets plus
`package.json`, tsconfig/jsconfig, import maps, and lock/config files. This
catches both edited package-local dependencies and newly added higher-priority files such as
`dep.ts` next to a previously selected `dep.js`. Documentation and media files
do not invalidate a plan, and the generated suite itself is explicitly omitted
from both identity passes. Resolved edges into another installed package are
listed as explicit external boundaries; the report does not claim that their
AST or source identity was covered, and `graphComplete` remains false until a
future transitive-boundary authenticator can prove that artifact. Use
`--allow-incomplete` only when that explicit proof gap is acceptable. Probe
adapters are stricter: their runtime graph must be self-contained (normally
bundled) so a stale recipe dependency cannot be replayed silently.

```sh
check-hot analyze ./src/index.ts
check-hot analyze my-package --json artifacts/analysis.json
check-hot analyze my-package --code-frame --color always
check-hot init my-package --probe --function transform,parse --test-runner ./runner.mjs
```

`init --function` filters the runtime function map before the external runner
lists recipes. It is the fast path for “check these functions”: unselected
exports create no disposable attempts, while their static findings and explicit
`ignored` ledger entries remain visible. If the requested function exists but
the selected runner has no recipe for it, `init` fails instead of generating an
empty or falsely complete suite. Without an explicit `--function`/`--top`, a
missing recipe remains `blocked`, never `ignored`. `--top` controls generated
output ranking; it is not a replacement for the explicit pre-probe function
filter.

Annotated functions rank first, then runtime-linked public functions, then
unmarked internal candidates. This keeps a large development build's internal
helpers from hiding callable API targets while preserving explicit
`check-hot:` intent. Nested adapter locators may be selected by their readable
path (`Children.map`) when unique; an ambiguous name must use the exact
structured target ID shown by the probe.

## Facts versus optimization evidence

The AST can prove that a parameter reaches a computed property access, callback
call, numeric operation, array mutation, or object field. It cannot prove that
the operation is slow. Eligible facts produce typed obligations and mutation
plans; workers decide the result from actual engine behavior.

Built-in argument mutators construct a stable semantic seed during warmup and
introduce these variants only during guarded stress:

- six independently constructed field layouts for ordinary mutable records;
- five callback identities created at distinct function-literal sites;
- strings, numeric keys, and symbols when a proven key parameter has a valid
  semantic seed;
- packed SMI, packed double, packed object, holey, and sparse arrays;
- SMI values, doubles, `-0`, `NaN`, int32/uint32 boundaries, and overflow;
- ordinary/null prototypes for plain records.

Class instances, null-prototype records, built-ins such as `Date`, symbols,
`__proto__`, accessors, constrained descriptors, array subclasses, holey seed
arrays, and arrays with extra properties are not cloned by the generic mutator.
They remain blocked until an adapter supplies a semantics-aware scenario.

Return-representation, dynamic-code, field-constness, cross-realm, local
allocation, and internal-state findings remain advisory unless there is an
exact owning runtime function plus a sound input/observation plan. The analyzer
does not turn every heuristic into thousands of permanently blocked
obligations. Advisory risks stay in the report; measurable experiments alone
enter the coverage ledger.

Each dynamic mutation is preflighted against a semantic seed in a disposable
process. The measurement starts in a new process with fresh feedback. Closing
an automatic AST obligation requires all of: an args-aware `verifyMutation`
assertion for the actual mutated receiver/arguments and variant, an
exact runtime-function/source identity, a hit on the exact evidence range for
every variant before and after the full warmup lifecycle, and engine-confirmed
mutation representations. Node uses one Inspector precise block-coverage
session with per-variant delta snapshots for JavaScript site hits. Generated
TypeScript graphs are loaded through the core's `tsx` dependency, but their AST
obligations deliberately remain blocked because transformed offsets are not
treated as original-source offsets. Source-map transport is postponed and is
outside the current implementation scope. This implementation likewise reports Deno/Bun AST obligations as
blocked because it does not yet have an equivalent exact-site transport there;
ordinary hand-authored suites still run on all three runtimes.

Automatic obligations do not assume that the first recipe reaches the analyzed
branch. Core tries accepted labels in stable order and persists the first sample
that passes every semantic, representation, and exact-site gate. Explicit
`covers` claims remain bound to their declared recipe. See
[`sample-selection`](../src/sample-selection/README.md) for the replay and
tamper-validation boundary.

## Public package entries

Static provenance retains `{ modulePath, exportPath }` instead of parsing a
display string. Root `hot` and `./feature`'s `hot` therefore become distinct
runtime targets (`hot` and `./feature::hot`) even though ecosystem adapters see
the same local function name when choosing recipes. Probe discovery is isolated
per public entry; core qualifies and merges the manifests afterwards. A worker
resolves and hashes every selected entry before importing any of them.

Exact export keys and exhaustively enumerable wildcard keys are automatic.
Type-only, inactive, and `null` branches are not runtime exports. A wildcard
that cannot be enumerated remains a graph diagnostic instead of silently
claiming coverage.

A mutation that throws, lacks a seed, or is unsupported remains visible in the
ledger. Every external recipe attempt runs in a new process, twice, with a hard
timeout; a synchronous infinite loop is killed without suppressing later
recipes. The manifest records accepted, thrown, timed-out, unsupported, and
nondeterministic outcomes plus their lifecycle stage. Structural fingerprints
include initial and final arguments/receiver state and the verified result.
Opaque closure results require a recipe-owned `probeFingerprint` data
projection. The probe runtime is selected with `--probe-runtime`; its exact
runtime/engine fingerprint must match the measurement worker. The whole runtime
worker also has a hard timeout.

## Coverage ledger

Candidate IDs include source offsets so same-name functions on one line cannot
collide. Each run is fingerprinted with runtime, engine, tier, and oracle
versions. Its ledger entry retains the exact AST evidence, obligation, selected
scenario, semantic/site-hit preflight, requested variants, representation
observations, reason, and terminal status. `--top` and ignore configuration
create explicit `excluded-by-user`/`ignored` records; they never make
obligations disappear.

Static findings that have no sound generic runtime experiment remain visible as
hypotheses. This is deliberate: inventing semantically invalid input just to
claim 100% coverage would be worse than an explicit blocked obligation.

Factory/UMD packages such as a callable namespace cannot always be linked to a
public function by static exports alone. An isolated probe fingerprints the
actual public callable with SHA-256 of `Function.prototype.toString()`. The
generator reconciles it only with one exact Oxc owning-function source hash;
same-name candidates and ambiguous identical bodies do not qualify. Every
attempt repeats and revalidates that target identity, and measurement rejects a
target changed after probe. This recovers low-code AST obligations for factory
surfaces without a package-name registry in core.

## Source markers

For JS/TS, `check-hot:` markers come from Oxc comment tokens and cannot be found
inside strings or template literals. Other source languages use the fallback
comment scanner. Markers validate the suite target contract; AST obligations
independently account for analyzed evidence, so neither mechanism can silently
stand in for the other.

## Test layout

The test tree mirrors the proof layers instead of collecting every fixture in
one file:

- `src/analyzer/rules/*/detector.test.ts` keeps each positive smell example and
  its negative controls beside the detector and feature README;
- `tests/ast/scope.test.ts` covers destructuring, aliases, reassignment, and
  lexical shadows;
- `tests/ast/graph.test.ts` covers ESM, CommonJS, package exports, and incomplete
  dynamic edges;
- `tests/mutations/` covers safe variant construction and planner identity;
- `tests/mutations/coverage-ledger.test.ts` audits terminal ledger/schema
  behavior;
- `tests/oracles/` runs real good/bad engine controls, including wrong tier,
  deoptimization, missing stress invocation, skipped AST sites, and timeouts.

Every new automatic rule needs both a positive example and a case that looks
similar but must remain advisory or blocked.
