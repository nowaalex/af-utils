# Problem catalog

`problems` is the discoverability layer of check-hot. The catalog answers three
questions without requiring a reader to follow the complete analyzer/worker
call graph:

1. Which problem classes can check-hot currently recognize?
2. Which feature folder owns the checker and its proof boundary?
3. Which stable ID is emitted by analysis, runtime JSON, and human reports?

The catalog does not contain React, Lodash, date-fns, Svelte, or other inspected
library knowledge. Static problems remain beside their Oxc detectors under
`analyzer/rules/<feature>`. Engine-measured problems live under
`runtime-oracles/<feature>`. Each feature README contains a bad example, a safer
alternative, detection semantics, false-positive limits, and relevant tests.

Shared AST traversal, process orchestration, source hashing, and report layout
remain shared infrastructure. Feature folders reference those mechanisms; they
do not copy them.

`problemDefinitions` is the single programmatic index. Analyzer `rule` values
and runtime `problemId` values must resolve through it. A catalog test rejects
duplicate IDs and undocumented definitions.
