# Examples

Every project under `examples/src/**` is a standalone npm project. It must be possible to open its GitHub directory directly in CodeSandbox, StackBlitz, or a similar service without access to the rest of the pnpm workspace. This matches the [StackBlitz GitHub importer contract](https://developer.stackblitz.com/guides/integration/open-from-github#organizing-the-project-in-your-repository), which imports only the selected example directory.

## Standalone sandbox contract

- Every example package must have `"private": true`. Examples are neither versioned by Changesets nor published to npm.
- Dependencies on public local `@af-utils/*` packages must use the exact registry version from the corresponding `packages/**/package.json`.
- Do not use `workspace:`, `link:`, or `file:` dependency protocols in an example. External sandbox services cannot resolve those references after importing only the example directory.
- Exact local package versions are intentional: they make a sandbox reproducible. Inside this monorepo, pnpm still links a matching local workspace package because `linkWorkspacePackages` is enabled.

Run `pnpm nx run @af-utils/examples:versions` after changing a public package
version. `pnpm nx run @af-utils/examples:versions:check` enforces the contract
in CI, and the Changesets release PR updates these versions automatically.

Virtual examples are grouped by behavior rather than framework:
`virtual/<category>/<example>/<framework>`. For example,
`virtual/list/simple/react` and `virtual/list/simple/solid` are standalone
implementations of the same example. Framework-specific integrations may have
only one implementation, such as `virtual/list/bootstrap/react`.

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
2. Add the framework entry declared in `examples/structure.json` and describe
   the example in `README.md`.
3. Run `pnpm nx run @af-utils/examples:versions` and `pnpm install` from the
   repository root.

The website discovers the framework entry declared in `examples/structure.json`
and `README.md` automatically. The first README paragraph is used as the page
description, so no separate metadata or website route needs to be added.

`examples/structure.json` is the declarative source of truth for the examples
directory and every framework's entry file, adapter package, template,
dependencies, build command, icon, and public route aliases.
`examples/config.ts` derives paths and route mappings from it. Website
integrations, components, generators, and tests must consume this configuration
instead of assembling physical paths or duplicating framework metadata.
Vite file discovery stays in the colocated
`examples/src/catalog.ts`, so its glob patterns are relative to the files they
describe. Every file in an implementation is exposed in the website source
viewer except files under `node_modules` or `dist` and `CHANGELOG.md` files.

The Astro integration injects one prerendered preview route per discovered
implementation. This gives Astro a static framework import for SSR and a
separate lazy hydration chunk for each example without maintaining a manual
component registry.

Example source, including Vue single-file components, is highlighted by Shiki
while Astro prerenders the site. The generated HTML fragments share the same
theme as Markdown code blocks and are fetched only when the code pane becomes
visible or a file is selected. Shiki is never shipped to the browser; sandbox
iframes are not assigned a `src` until their tab is opened. Keep
syntax-highlighting configuration in `website/src/utils/codeTheme.ts` rather
than configuring individual views.

`pnpm nx run @af-utils/examples:e2e` builds the production
documentation site and every standalone example before running the integration
suite in Chromium and Firefox.
Every route gets a hydration/error smoke test. Groups with multiple frameworks
additionally get an exact screenshot comparison; keep generated data
deterministic so pixel differences represent real rendering differences.

Tests that exercise behavior shared by all implementations belong in the
group-level `tests` directory and use `describeExample` to run once per
framework. Native scrollbar pointer tests run in Chromium because headless
Firefox exposes overlay scrollbars that Playwright cannot drag; route,
hydration, error, programmatic scrolling, and pixel-parity checks still run in
both browsers.

If an example cannot be server-rendered, set
`"af-utils": { "astroClientOnly": "react" }` (or another Astro renderer name)
in its `package.json`. Omit this field for the normal `client:visible` preview.
