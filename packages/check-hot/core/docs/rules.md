# Problems, experiments, and possible fixes

Analyzer findings are hypotheses. A finding explains why a path deserves an
experiment; runtime evidence is what makes optimization work actionable. Do not
rewrite healthy code merely to remove a static finding.

Problem-specific detection, examples, proof boundaries, and remediation live
beside their implementations:

| Problem                               | Feature documentation                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| Numeric representation changes        | [`numeric-representation`](../src/analyzer/rules/numeric-representation/README.md) |
| Public object/array receivers         | [`parameter-receiver`](../src/analyzer/rules/parameter-receiver/README.md)         |
| Dynamic property keys                 | [`property-key`](../src/analyzer/rules/property-key/README.md)                     |
| Callback identity diversity           | [`callback-identity`](../src/analyzer/rules/callback-identity/README.md)           |
| Local array element transitions       | [`array-elements`](../src/analyzer/rules/array-elements/README.md)                 |
| Property deletion and holes           | [`property-deletion`](../src/analyzer/rules/property-deletion/README.md)           |
| Object shape/prototype mutation       | [`shape-mutation`](../src/analyzer/rules/shape-mutation/README.md)                 |
| Loop allocation/control-flow pressure | [`loop-pressure`](../src/analyzer/rules/loop-pressure/README.md)                   |
| Mixed return representations          | [`return-representation`](../src/analyzer/rules/return-representation/README.md)   |
| Direct dynamic code                   | [`dynamic-code`](../src/analyzer/rules/dynamic-code/README.md)                     |
| Compilation/branch complexity         | [`compilation-complexity`](../src/analyzer/rules/compilation-complexity/README.md) |

## Reading terminal outcomes

- `passed`: semantics, exact source/function identity, exact post-warmup site
  hits, mutation representations, and the engine oracle were all confirmed.
- `failed`: the scenario remained meaningful but the requested engine invariant
  failed, such as a guarded deoptimization.
- `blocked`: the experiment could not prove a required fact, for example a
  transformed TS offset has no original-source transport (source-map support is
  intentionally postponed).
- `unsupported`: the runtime or generic mutator cannot represent the requested
  check safely.
- `ignored`: a person explicitly accepted a gap and supplied a reason.

A JIT pass with blocked AST coverage is printed as `JIT PASS / COVERAGE
BLOCKED`; it is never promoted to a complete pass.
