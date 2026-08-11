# Examples

Every project under `examples/src/**` is a standalone npm project. It must be possible to open its GitHub directory directly in CodeSandbox, StackBlitz, or a similar service without access to the rest of the pnpm workspace. This matches the [StackBlitz GitHub importer contract](https://developer.stackblitz.com/guides/integration/open-from-github#organizing-the-project-in-your-repository), which imports only the selected example directory.

## Standalone sandbox contract

- Every example package must have `"private": true`. Examples are neither versioned by Changesets nor published to npm.
- Dependencies on public local `@af-utils/*` packages must use the exact registry version from the corresponding `packages/**/package.json`.
- Do not use `workspace:`, `link:`, or `file:` dependency protocols in an example. External sandbox services cannot resolve those references after importing only the example directory.
- Exact local package versions are intentional: they make a sandbox reproducible. Inside this monorepo, pnpm still links a matching local workspace package because `linkWorkspacePackages` is enabled.

Run `pnpm examples:versions` after changing a public package version. `pnpm examples:versions:check` enforces the contract in CI, and the Changesets release PR updates these versions automatically.

The standalone guarantee applies to the documentation branch after its corresponding npm release. A development or release branch that intentionally uses an unreleased API can only run inside the monorepo until that package version has been published; a registry-only sandbox cannot install code that does not exist in the registry yet.

## Adding an example

1. Create a private package under `examples/src/<project>/...` that can install and run on its own.
2. Add any dependencies required to build the example to `website/package.json` as well.
3. Run `pnpm examples:versions` and `pnpm install` from the repository root.
