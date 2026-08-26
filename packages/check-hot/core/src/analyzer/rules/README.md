# Analyzer rule features

> **Change Contract**
>
> - **Responsibility:** define the common structure and registration path for
>   problem-specific analyzer features.
> - **Boundary:** a feature owns one risk and its proof metadata; it must not
>   introduce a second shared traversal or duplicate common dataflow logic.
> - **Invariants:** detector, catalog metadata, examples, remediation, and tests
>   remain colocated and every feature is dispatched once.
> - **Configuration owners:** [index.ts](./index.ts) owns dispatch;
>   [catalog.ts](./catalog.ts) and each feature's `detector.ts` own registration.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

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
