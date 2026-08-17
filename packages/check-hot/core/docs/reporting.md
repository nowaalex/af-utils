# Reporting

Human and machine output are separate contracts.

```sh
check-hot analyze ./src/index.ts --code-frame --color auto
check-hot run check-hot.suite.mjs --verbose --json artifacts/check-hot.json
```

`--color auto|always|never` controls ANSI colors. `auto` respects TTY detection
and `NO_COLOR`. JSON never contains ANSI escape sequences.

A source frame identifies the exact AST span and evidence:

```text
warning: heterogeneous-array-literal — a generalized literal was proven
82 │ const values = [-2, null, () => {}]
   │                ^^^^^^^^^^^^^^^^^^^^^
```

Analysis frames support multiline spans, tabs, Unicode source text, and CRLF
input. Runtime deopt text does not contain a stable AST ID: a matching runtime
function name is labelled as name-only correlation, and the report explicitly
keeps exact source-site correlation unavailable. It does not present a
non-unique/minified function name as proof of one AST location. Source-map
remapping is not implemented in this release.

The runtime summary prints exact runtime/engine/oracle and adapter/probe
versions. On failure it includes an actionable deopt explanation and a quoted
reproduction command. The final summary separates passed, failed, blocked,
unsupported, ignored, and excluded obligations. Raw stdout/stderr, commands,
statuses, trace lines, probe attempts, and coverage entries remain available in
JSON or the generated versioned manifest.

Every reportable failure uses the same JSON shape:

```json
{
    "problemId": "v8-tier-mismatch",
    "targetId": "readCount",
    "message": "Target readCount requested turbofan but ended at maglev"
}
```

`problemId` must exist in the public `problemDefinitions` catalog. There is no
parallel string-only `errors` field on worker, run, or summary results.

`JIT PASS / COVERAGE BLOCKED` means tier/deoptimization checks passed but at
least one selected runtime obligation lacked sound evidence. It is deliberately
not rendered as a complete PASS.

## Offline artifact report

```sh
check-hot run suite.mjs \
  --artifacts .check-hot/run-001 \
  --diagnostics v8-ic-maps,cpu-profile
check-hot report .check-hot/run-001 --verbose
```

The bundle has a schema/version manifest, SHA-256 inventory, per-cell raw
stdout/stderr/commands, separate event streams, and optional profiles/logs. The
offline command verifies every declared file before reading the summary and
does not import the suite. It is not hermetic replay: executables, operating
system state, environment, and external services are not snapshotted.
The manifest itself is not signed, so its hashes detect corruption only when
the manifest came from a trusted channel; they are not protection against an
attacker who can rewrite the entire bundle.

Diagnostic reruns are advisory. Their events retain a distinct stream ID and
local sequence; the report never invents chronology between fresh processes.
All primary cells finish before any diagnostic begins. Every requested
diagnostic then repeats setup and the selected workload in a fresh process;
external side effects are neither snapshotted nor rolled back. Raw artifacts
are unredacted and may contain secrets.

Use `diagnosticStressIterations` in the programmatic API, or
`--diagnostic-stress v8-ic-maps=1000,cpu-profile=50000` in the CLI, when
collectors need different sampling budgets. Keep `v8-ic-maps` short enough to
bound the raw V8 log and give `cpu-profile` enough iterations to sample the
authenticated target. These budgets affect only fresh advisory reruns, never
the primary measurement or its verdict.
