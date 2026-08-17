# Analyzer rule features

Every problem-specific directory owns four things together:

- `README.md`: what can go wrong, a minimal risk example, how runtime evidence
  confirms it, and possible remediation;
- `detector.ts`: the AST detector plus its mutation-family and automation
  metadata;
- `detector.test.ts`: positive and adversarial examples next to the detector;
- optional feature-local state only when the proof needs aggregation.

The dispatcher in `index.ts` performs the common candidate traversal. AST
helpers, lexical/dataflow proof, finding reporting, and expression kinds remain
shared because copying them into every feature would weaken correctness and
violate DRY.

Current feature directories:

- `array-elements`
- `callback-identity`
- `compilation-complexity`
- `dynamic-code`
- `loop-pressure`
- `numeric-representation`
- `parameter-receiver`
- `property-deletion`
- `property-key`
- `return-representation`
- `shape-mutation`
