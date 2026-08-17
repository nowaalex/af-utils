# Bun JavaScriptCore sampling

This optional oracle wraps guarded stress in Bun's public `bun:jsc.profile`
sampling profiler during a separate diagnostic rerun. It reports the sampled
LLInt, Baseline, DFG, and FTL distribution plus Bun's formatted hottest
functions/bytecodes.

## Misleading conclusion

```text
FTL samples: 0 => the target failed optimization
```

Sampling may miss short code and Bun does not expose the currently attached
tier. This module therefore remains advisory and never changes the primary JSC
compilation/retry verdict.

## Useful conclusion

```text
Baseline 72%, DFG 25%, FTL 0%, total 420 samples
```

Use the distribution to prioritize an isolated scenario, then rely on the
primary DFG/retry counters and semantic checks before changing code.

Bun's public categories may overlap, so their counts are never summed into a
synthetic total. Check-hot requires Bun's explicit `Total samples` field and
checks each rendered percentage against that total within its printed rounding
precision. Missing or inconsistent totals are reported as an advisory gap while
the bounded raw tier table remains available for inspection.
