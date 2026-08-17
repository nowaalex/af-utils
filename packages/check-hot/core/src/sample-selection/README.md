# Adaptive semantic sample selection

An analyzer obligation identifies a public argument and mutation family, but it
cannot know which semantic recipe reaches the exact internal source site. A
fixed first recipe is therefore unsafe: a valid function can have several input
branches, and only a later recipe may exercise the analyzed branch.

Bad practice is to bind every generated obligation to `labels[0]` and report the
library as blocked when that unrelated recipe misses the site. Check-hot instead
tries declared recipes in stable manifest order inside the disposable preflight.
It accepts the first recipe that passes the existing result verifier,
representation-transition checks, and exact-site baseline/stress coverage. The
fresh measurement process receives only that selected `sampleId`.

The selection is evidence, not a heuristic optimization claim. If every recipe
fails, the outcome remains blocked and contains bounded per-recipe reasons. The
measurement worker rejects undeclared or missing persisted sample IDs, so a
changed or tampered preflight cannot silently replay another workload.

Explicit `covers` claims remain singleton selections: the adapter author already
declared which recipe proves that obligation. Automatic obligations may consider
all accepted labels for the public function. Explicit in-process iteration
overrides use the maximum declared budget across those candidates; external
runner recipes fall back to the suite-level budget because their overrides are
not part of the probe manifest.
