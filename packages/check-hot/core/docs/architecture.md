# Architecture

The pipeline is intentionally split into cataloged problems, facts,
experiments, and evidence:

```text
typed problemDefinitions[]
        ↓
package.json exports/imports
        ↓
condition-aware module graph
        ↓
Oxc AST facts + local symbol/provenance pass
        ↓
typed check obligations
        ↓
seed providers + deterministic mutation plans
        ↓
fresh Node/Deno/Bun workers
        ↓
versioned engine evidence
        ↓
coverage ledger + source code frames + JSON
```

The [problem model](./problems.md) is the discoverability boundary. Every
static finding, measured engine failure, and proof/integrity gap has a stable ID
and one feature-owned README/checker/test location. Reports contain typed
problem occurrences; there is no legacy free-form `errors` array.

## Product invariants

1. A syntactic fact is not a performance verdict.
2. Every dataflow-proven, eligible AST fact creates at least one check
   obligation.
3. Every obligation receives a terminal outcome for every requested runtime:
   `passed`, `failed`, `blocked`, `unsupported`, or `ignored` with a reason.
4. Blocked, unsupported, ignored, or excluded checks are not counted as passed.
5. An incomplete module graph makes coverage incomplete and prevents automatic
   suite generation unless the user explicitly accepts it.
6. Generated `createModuleSuite` configurations import the inspected target only
   inside fresh workers. A hand-authored suite is ordinary JavaScript and must
   avoid a top-level target import if it wants the same isolation guarantee.
7. Engine adapters expose evidence with its real meaning. Historical JSC DFG
   compilation is not renamed to a current optimized state.
8. A generated suite authenticates every selected native public root/subpath,
   every parsed graph file, and a conservative resolver-sensitive package tree
   before it imports target code. A stale plan never degrades into a pass.
9. Bounded concurrency never changes lifecycle order inside a matrix cell or
   between the two determinism attempts for one probe coordinate. Default
   execution remains sequential because process isolation does not isolate
   external files, ports, services, or CPU scheduling.

## Package boundary

`@af-utils/check-hot` owns resolution, AST/provenance analysis, mutation
planning, process orchestration, engine adapters, coverage, and reporting.

`@af-utils/check-hot-test-runners` owns optional knowledge of external package
APIs and semantic seed inputs. Its adapters only validate versions, enumerate
labels, and recreate samples. Process isolation, hard timeouts, repetition,
semantic fingerprints, runtime invocation, and terminal attempt accounting all
remain in core. An adapter may return structured locators for nested public
functions, but never supplies the callable or receiver: core resolves both from
own data properties and authenticates the function. Fixture lifecycle
declarations use the same generic plugin protocol. Core never imports the
adapter package or switches on an inspected package name.

## Analyzer module boundaries

The analyzer facade delegates to modules with one proof responsibility each:

| Area                   | Responsibility                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| model                  | Stable public report/options contract                                 |
| AST                    | Oxc node traversal and source coordinates                             |
| resolution             | Conditional package exports, paths, subpaths, and graph entries       |
| provenance             | ESM/CJS public origins, owning functions, and source markers          |
| syntax/data-flow rules | Scope-aware input origins and one shared candidate traversal          |
| evidence               | Portable source hashes and measurable obligations                     |
| source identity        | Entry, parsed graph, and resolver-sensitive package-tree hashes       |
| public target identity | Collision-free module/export locators shared by manifests and workers |
| probe                  | Fresh-process recipe attempts, hard timeouts, and fingerprints        |
| generator              | Low-code portable suite source                                        |
| report                 | Human code frames and explanations                                    |

The source tree also contains `src/analyzer/README.md` with dependency rules and
the checklist for adding a detector. The [problem catalog](./rules.md) explains
each current rule family with source examples and conditional fixes.
Shared public-target rules live beside `src/public-target/README.md`; they are
not duplicated in detectors or ecosystem adapters.

## Why TypeScript and Oxc

Runtime probes must execute JavaScript inside the runtime that owns the target
function, so a Rust orchestration rewrite would not improve the oracle. The
core uses TypeScript for a discoverable plugin/suite contract and ordinary ESM
workers. Oxc supplies its Rust-backed parser and resolver for fast JS/JSX/TS/TSX
ASTs, comments, package exports, TypeScript paths, and NodeNext-style module
resolution.

## Regex policy

JS/TS structure is read from AST nodes and parser comments. Regex remains
appropriate for V8's textual trace protocol and as a fallback annotation
adapter for languages for which no parser is installed. Name-based test-runner
recipes are explicitly labelled heuristic seeds and cannot by themselves close
an AST obligation.
