# Coverage and semantic proof

> **Change Contract**
>
> - **Responsibility:** decide whether each analyzer obligation has exact-site,
>   mutation-aware semantic proof and a terminal outcome.
> - **Boundary:** optimizer status, execution of a parent function, or a
>   result-type check alone must not close an obligation.
> - **Invariants:** every obligation is accounted for and only authenticated
>   baseline/stress evidence with the required verifier can pass.
> - **Configuration owners:** [check.ts](./check.ts) owns proof evaluation;
>   [problem.ts](./problem.ts) owns failure reporting.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## Problem

A function can remain optimized while the intended mutation never reaches the
exact AST operation, produces the wrong result, or fails to demonstrate the
required representation. Treating that run as complete would be a false pass.

```ts
// Bad proof: the type is right even when the mutated value is wrong.
verify(result) {
    if (typeof result !== "number") throw new TypeError();
}
```

## Better practice

Every analyzer obligation receives `passed`, `failed`, `blocked`, `unsupported`,
or explicitly `ignored`. Only a semantically verified mutation with exact
owner/site evidence can pass.

```ts
verifyMutation({ args, result }) {
    if (!Object.is(result, args[0] + 1)) throw new Error("wrong result");
}
```

If a generated value is outside the public API contract, declare that boundary
separately. It is recorded as excluded and never counted as evidence:

```ts
acceptMutation({ args }) {
    return Number.isFinite(args[0])
        ? true
        : "this API accepts finite numbers only";
}
```

The baseline always runs, every accepted variant still passes
`verifyMutation`, and at least one accepted variant must demonstrate a real
engine-visible transition. The cached preflight partition is replayed without
calling `acceptMutation` again.

## Implementation

`module-suite.ts` and the runtime workers build the evidence ledger. `check.ts`
maps its non-pass terminal states to stable problem IDs used by the report.
Mutation-family implementations stay beside their analyzer problem because
they describe how to exercise that exact risk.
