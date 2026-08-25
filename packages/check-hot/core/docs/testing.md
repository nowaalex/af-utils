# Verification strategy

The verification layers answer different questions and must not be collapsed
into one percentage.

| Layer                      | Evidence                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Unit and integration tests | Deterministic analysis, planning, protocol, reporting, and failure behavior               |
| Real runtime controls      | Actual Node, Deno, Bun, V8, and JavaScriptCore semantics when those runtimes are required |
| Mutation testing           | Whether tests reject injected faults inside the configured deterministic source scope     |
| Consumer audits            | Whether a packed or external ecosystem path works through the public interface            |

`pnpm nx run @af-utils/check-hot:test` runs the Vitest suite and real runtime
controls available to the configured gate. CI can require runtime executables;
a missing required engine is then a failure rather than a skipped pass.

`pnpm nx run @af-utils/check-hot:test:mutation` runs the bounded StrykerJS
scope. Its threshold applies only to the checked-in `mutate` list. Process
orchestration, module-suite integration, and engine workers are instead covered
by ordinary, adversarial, and real-runtime controls, so a mutation score must
never be presented as coverage of every core source file.

Mutation-plan producer and consumer checks remain independent so one shared
validation bug cannot create a false proof. The pnpm configuration names the
Vitest plugin explicitly as required by the
[StrykerJS pnpm guidance](https://stryker-mutator.io/docs/stryker-js/troubleshooting/#plugins-cant-be-found-when-using-pnpm-as-package-manager).

Run the full local package evidence from the repository root:

```sh
pnpm nx run @af-utils/check-hot:test
pnpm nx run @af-utils/check-hot:test:mutation
pnpm nx run @af-utils/check-hot:build
```

The repository-level command and task ownership remain in
[`conventions.md`](../../../../conventions.md).
