# Runtime event timeline

This shared module normalizes lifecycle and engine observations without turning
diagnostic data into a verdict. Primary workers record ordered phase boundaries
and exact target observations. Separate diagnostic reruns add V8 log, JSC
sampling, or CPU profile events.

## Bad interpretation

```text
LoadIC P -> N, function name "get"
therefore src/cache.ts:42 is broken
```

Names and raw V8 log sites are not unique, and the logging rerun is not the
primary proof process.

## Honest interpretation

```text
diagnostic: LoadIC polymorphic -> megamorphic
correlation: name-only
next step: reproduce the isolated scenario and compare receiver Maps
```

Events carry an explicit correlation precision. An event can explain or rank a
problem, but only the primary tier/deoptimization/coverage oracles decide the
run status.
