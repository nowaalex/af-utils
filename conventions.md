# Repository conventions

## Workspace ownership

pnpm owns dependency installation, workspace linking, lockfile updates, and
publishing. Nx discovers projects from `pnpm-workspace.yaml` and owns task
scheduling, dependency ordering, and caching. Package manifests and the
filesystem are the project source of truth; do not duplicate the workspace
project list in `nx.json`.

Run repository and package tasks through Nx. A target may invoke its underlying
tool directly, such as `tsc`, `vitest`, `vite`, or `astro`, but it must express
dependencies on other targets or projects with Nx `dependsOn`. Do not use
`pnpm --filter` or nested package scripts to build an execution pipeline.

Direct pnpm commands are reserved for dependency installation, the `prepare`
Git-hook lifecycle, lockfile maintenance, environment bootstrap such as
Playwright browser installation, and Changesets version/publish boundaries.
These operations are package-manager responsibilities rather than cacheable
workspace tasks. Repository validators may query pnpm for workspace metadata,
but must not use it to schedule target pipelines.

## Commands

Use these commands from the repository root:

| Task                                     | Command                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| Format the repository                    | `pnpm nx run workspace:format`                                |
| Check formatting and lint                | `pnpm nx run workspace:check-style`                           |
| Type-check all projects                  | `pnpm nx run-many -t typecheck`                               |
| Test all projects                        | `pnpm nx run-many -t test`                                    |
| Build publishable packages               | `pnpm nx run-many -t build --projects=tag:npm:public`         |
| Build packages and website               | `pnpm nx run-many -t build --projects=tag:npm:public,website` |
| Build standalone examples                | `pnpm nx run-many -t build --projects='examples/**'`          |
| Update generated examples and versions   | `pnpm nx run @af-utils/examples:versions`                     |
| Validate generated examples and versions | `pnpm nx run @af-utils/examples:versions:check`               |
| Validate package READMEs                 | `pnpm nx run workspace:packages-readmes-check`                |
| Validate Nx task ownership               | `pnpm nx run workspace:nx-contracts-check`                    |
| Validate package tarballs                | `pnpm nx run-many -t publint --projects=tag:npm:public`       |
| Run browser integration tests            | `pnpm nx run @af-utils/examples:e2e`                          |
| Validate generated website files         | `pnpm nx run workspace:website-generated-check`               |

Root `package.json` scripts are convenience aliases for these Nx entry points.
CI uses the explicit Nx commands so the task graph is visible in logs. Use
`pnpm nx graph` to inspect relationships and
`pnpm nx affected -t build test typecheck` for an affected-only local check.
Repository CI intentionally runs the complete gates.

## Documentation

Every pnpm workspace package must have a `README.md` beside its `package.json`,
including private infrastructure packages and standalone examples. It must
explain the package's purpose and link to relevant usage or development
instructions.

API Extractor owns `packages/**/etc/*.api.md`. Do not edit or externally format
these byte-for-byte generated reports.

## TypeScript API and naming

- Document every production class method, constructor, getter, setter,
  interface method signature, and method-like callback field with TSDoc,
  including private and package-internal members. Use `/** ... */`; ordinary
  implementation comments are not API documentation.
- Prefix class members and object properties with `_` when they are internal
  runtime details that esbuild may mangle. Do not prefix ordinary functions;
  identifier minification already shortens local names.
- Use a getter for an argument-free, side-effect-free, inexpensive read of
  current object state that neither allocates a new object nor transfers
  ownership. Use a method for actions, parameterized work, snapshots, and
  resource creation.

## Formatting and linting

Oxfmt formats JavaScript, TypeScript, JSX, TSX, JSON, CSS, HTML, Markdown, and
generated TypeDoc reference files. Prettier with the official plugins is the
only formatting exception for `.astro` and `.svelte` templates. Oxlint checks
JavaScript and TypeScript; `astro check`, `svelte-check`, and Nx type-check
targets own their semantic checks. The checked-in tool configuration is the
source of truth for enabled rules.

Warnings fail `workspace:check-style`. If an Oxlint warning is demonstrably
incorrect or its fix would measurably damage a hot path or benchmark, add the
narrowest line or block suppression with the concrete reason. Do not disable
the rule globally; unused suppressions fail the style gate.

## Integration and worktrees

The `@af-utils/examples:e2e` target is the production integration gate for all
examples in Chromium and Firefox. Paired framework implementations must also
pass exact pixel-parity checks.

Create repository worktrees only inside the root `./git-worktrees/` directory.
