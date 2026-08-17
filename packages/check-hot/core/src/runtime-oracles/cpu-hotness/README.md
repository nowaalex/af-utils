# CPU-profile hotness ranking

This optional diagnostic rerun records a runtime `.cpuprofile` and ranks
functions by observed sample count. Sampling is a prioritization signal, not a
benchmark and not proof that an unobserved function is cold.

The current runtime profiler covers the complete fresh diagnostic process:
runtime startup, module loading, suite setup, warmup, and guarded stress. The
reported share is therefore a whole-process sample share, not production
hotness. Check-hot separately totals samples correlated with authenticated
analyzer candidates so loader activity cannot masquerade as target evidence.

## Misleading conclusion

```text
samples: 0 => optimized and fast
```

A profiler can simply miss a short function. Zero samples are reported as
unobserved.

## Useful conclusion

```text
parseNode: 28% of samples, authenticated JS candidate owner
readField: 0 samples, unobserved
```

Investigate runtime-confirmed problems in sampled functions first. Candidate
owner correlation is allowed only for authenticated, untransformed JavaScript
whose function-definition position falls inside one unique analyzer owner. It
is target-level evidence, never exact operation-site evidence.
TypeScript/JSX source maps are intentionally not used.
