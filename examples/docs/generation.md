# Example generation and website integration

> **Change Contract**
>
> - **Responsibility:** keep example discovery, standalone generation, website
>   routes, source viewing, and hydration derived from one framework catalog.
> - **Boundary:** consumers must not duplicate framework metadata or assemble
>   physical example paths independently.
> - **Invariants:** generated files match their templates, one group README owns
>   shared behavior, and each implementation remains a standalone project.
> - **Configuration owners:** [structure.json](../structure.json),
>   [config.ts](../config.ts), [src/catalog.ts](../src/catalog.ts), and
>   [templates](../templates/).
> - **Targeted check:** `pnpm nx run @af-utils/examples:versions:check`.

The website discovers the framework entry declared in
[structure.json](../structure.json) and its generated implementation
`README.md` automatically. The first README paragraph becomes the page
description, so begin the group README with behavior a user can observe.
`sync-examples.mjs` copies that description to every implementation; do not
maintain framework-by-framework paraphrases.

`structure.json` is the declarative source of truth for the examples directory
and every framework's entry file, adapter package, template, dependencies,
build command, and icon. [config.ts](../config.ts) derives paths and route
mappings from it. Website integrations, components, generators, and tests must
consume this configuration instead of assembling physical paths or duplicating
framework metadata.

Generated standalone boilerplate lives under [templates](../templates/).
`sync-examples.mjs` copies those files and resolves dependency versions from
[package.json](../package.json). Vite file discovery stays in
[src/catalog.ts](../src/catalog.ts), so its glob patterns remain relative to the
files they describe. The website source viewer exposes every implementation
file except files under `node_modules` or `dist` and `CHANGELOG.md` files.

The Astro integration injects one prerendered preview route per discovered
implementation. This gives Astro a static framework import for server-side
rendering and a separate lazy hydration chunk for every example without a
manual component registry.

Example source, including Vue single-file components, is highlighted by Shiki
while Astro prerenders the site. Generated HTML fragments share the Markdown
code theme and are fetched only when the code pane becomes visible or a file is
selected. Shiki is never shipped to the browser, and sandbox iframes receive no
`src` until their tab opens. The website's `src/utils/codeTheme.ts` owns the
syntax-highlighting configuration.

If an example cannot be server-rendered, set
`"af-utils": { "astroClientOnly": "react" }` (or another Astro renderer name)
in its `package.json`. Omit this field for the normal `client:visible` preview.
