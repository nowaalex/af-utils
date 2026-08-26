# Generated-output safety

> **Change Contract**
>
> - **Responsibility:** prove that ignored generated output cannot change the
>   runtime resolution graph it authenticates.
> - **Boundary:** output paths must not be excluded by filename convention or
>   convenience when they could become imports or public exports.
> - **Invariants:** every selected edge, extension fallback, directory index,
>   and active export pattern is checked before exclusion.
> - **Configuration owner:**
>   [output-safety.ts](./output-safety.ts) owns the proof.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

`check-hot init` usually writes a suite near the target. That output must be
excluded from the package-tree hash or the freshly generated suite would
invalidate itself. Blind exclusion is unsafe, however.

## Bad placement

```json
{
    "exports": { "./*": "./*.mjs" }
}
```

Writing `check-hot.suite.mjs` into that package creates a new public subpath.
With Bun/TypeScript extension priority, a generated file can also replace a
previously selected extensionless import.

## Safe behavior

`assertIgnoredFilesCannotChangeResolution` compares the output with the entry,
every selected relative edge, index-directory fallback, and active package
exports. A collision is rejected with a request to place `--out` elsewhere;
only a proven non-resolving output may be ignored.

The negative controls are at the start of `tests/ast/graph.test.ts`.
