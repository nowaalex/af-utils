# Examples

> **Change Contract**
>
> - **Responsibility:** keep every documented example runnable as an isolated
>   sandbox and keep equivalent framework implementations behaviorally aligned.
> - **Boundary:** examples demonstrate product behavior; conceptual guidance
>   belongs on the documentation site, and package/API contracts belong in
>   package manifests and generated reference pages.
> - **Invariants:** `examples/structure.json` owns framework discovery; one
>   group-level `README.md` owns the shared behavior description; generated
>   implementation files must match their templates and shared sources.
> - **Configuration owners:** `examples/structure.json`,
>   `examples/package.json`, group-level styles/tests/READMEs, and
>   `examples/templates/`.
> - **Targeted check:**
>   `pnpm nx run @af-utils/examples:versions:check`.

Every project under `examples/src/**` is a standalone npm project. It must be possible to open its GitHub directory directly in CodeSandbox, StackBlitz, or a similar service without access to the rest of the pnpm workspace. This matches the [StackBlitz GitHub importer contract](https://developer.stackblitz.com/guides/integration/open-from-github#organizing-the-project-in-your-repository), which imports only the selected example directory.

## Standalone sandbox contract

- Every example package must have `"private": true`. Examples are neither versioned by Changesets nor published to npm.
- Dependencies on public local `@af-utils/*` packages must use the exact registry version from the corresponding `packages/**/package.json`.
- Do not use `workspace:`, `link:`, or `file:` dependency protocols in an example. External sandbox services cannot resolve those references after importing only the example directory.
- Exact local package versions are intentional: they make a sandbox reproducible. The leaf packages are deliberately excluded from the pnpm/Nx project graph; the parent `@af-utils/examples` workspace package provides their shared local development dependencies.

Run `pnpm nx run @af-utils/examples:versions` after changing a public package
version. `pnpm nx run @af-utils/examples:versions:check` enforces the contract
in CI, and the Changesets release PR updates these versions automatically.

Virtual examples are grouped by behavior rather than framework:
`virtual/<category>/<example>/<framework>`. For example,
`virtual/basics/simple-list/react` and `virtual/basics/simple-list/solid` are standalone
implementations of the same example. Framework-specific integrations may have
only one implementation, such as `virtual/integrations/material-ui/react`.

Shared behavioral tests live at `virtual/<category>/<example>/tests`. A
group-level `style.module.css` is the visual source of truth when an example
has multiple implementations; `pnpm nx run @af-utils/examples:versions` copies it into each
standalone project, generates framework entrypoints and package metadata, and
synchronizes exact local package versions. CI runs
`pnpm nx run @af-utils/examples:versions:check`.

The standalone guarantee applies to the documentation branch after its corresponding npm release. A development or release branch that intentionally uses an unreleased API can only run inside the monorepo until that package version has been published; a registry-only sandbox cannot install code that does not exist in the registry yet.

## Adding an example

1. Create a private package under
   `examples/src/<project>/<category>/<example>/<framework>` that can install
   and run on its own.
2. Add the framework entry declared in `examples/structure.json`. Describe
   shared behavior once in the example group's `README.md`; put
   framework-specific explanation in source comments only when the code itself
   is otherwise unclear.
3. Run `pnpm nx run @af-utils/examples:versions` and `pnpm install` from the
   repository root.

Continue with the focused maintainer guides:

- [Generation and website integration](./docs/generation.md)
- [Browser and cross-framework testing](./docs/testing.md)
