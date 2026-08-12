# af-utils/\*

Simple open-source tools that just work _(usually fast)_

## [Virtual scroll](https://af-utils.com/virtual)

![Virtual scroll opengraph image](website/src/assets/og/virtual.png)

### Features

The React adapter targets React 19.2+. The Solid adapter targets Solid 1.9+.

- [vertical](https://af-utils.com/virtual/examples/react/list/simple) / [horizontal](https://af-utils.com/virtual/examples/react/list/horizontal) / [grid](https://af-utils.com/virtual/examples/react/hook/grid) / [custom](https://af-utils.com/virtual/examples/react/hook/custom-render) modes
- [dynamic item sizes](https://af-utils.com/virtual/examples/react/list/variable-size-list)
- [sticky header and footer](https://af-utils.com/virtual/examples/react/list/sticky-header-and-footer)
- [scrollToIndex method](https://af-utils.com/virtual/examples/react/list/scroll-to-item)
- [load on demand](https://af-utils.com/virtual/examples/react/list/load-on-demand)
- [window scroll](https://af-utils.com/virtual/examples/react/hook/window-scroll)
- [material-ui](https://af-utils.com/virtual/examples/react/list/material-ui) / [bootstrap](https://af-utils.com/virtual/examples/react/list/bootstrap) integration
- [Solid list](https://af-utils.com/virtual/examples/solid/list/simple) / [Solid primitives](https://af-utils.com/virtual/examples/solid/primitives/simple)

## [Scrollend polyfill](https://af-utils.com/scrollend-polyfill)

![Scrollend polyfill opengraph image](website/src/assets/og/scrollend-polyfill.png)

## Repository conventions

- Every production TypeScript class method, constructor, getter, setter, interface method signature, and method-like callback field must have a TSDoc comment, including private and package-internal members.
- Use `/** ... */`; ordinary implementation comments do not replace API documentation.
- Prefix class members and object properties with `_` when they are internal runtime implementation details so esbuild can mangle them.
- Do not prefix ordinary functions with `_`; local identifiers are already shortened by identifier minification.
- Use a getter for an argument-free, side-effect-free read or inexpensive derivation of current object state that does not allocate a new object or transfer ownership. Use a method for actions, parameterized work, and operations that create snapshots or resources; having no arguments alone does not make an operation a getter.
- Create repository worktrees only inside the root `./git-worktrees/` directory.
- `pnpm check:style` is the formatting and linting gate used by CI and the
  repository pre-push hook installed by `pnpm install`. Warnings fail the gate
  and must be fixed before pushing.
- Oxfmt is the repository formatter for JavaScript, TypeScript, JSX, TSX, JSON,
  CSS, HTML, Markdown, and the generated TypeDoc reference. Oxlint checks the
  JavaScript and TypeScript family. Run `pnpm format` to write formatting and
  `pnpm lint` to run the zero-warning lint gate.
- Zed project settings automatically install its official `oxc` extension,
  prevent automatic Biome installation, and explicitly disable the Biome
  language server for this repository. Oxfmt and safe Oxlint fixes run on save;
  Astro files remain assigned to the Astro language server.
- The Oxlint strict profile promotes the `correctness`, `suspicious`, and
  `perf` categories to errors. Its baseline enables the ESLint, TypeScript,
  import, Node.js, Promise, Oxc, and Unicorn plugins; React and JSX
  accessibility rules apply only to React sources, and Vitest rules only to
  unit tests and benchmarks.
- Selected pedantic guards additionally require explicit enum values, reject
  redundant `async` functions and Promise-executor returns, and audit closures
  declared in loops. The next semantic tier requires Unicode-aware regular
  expressions, explicit length checks and built-in construction; it also
  rejects dead assignments, redundant `undefined` values, and iterator
  callbacks whose behavior could accidentally depend on extra arguments.
  Architectural rules reject dependency cycles and imports that bypass a
  published `@af-utils` package entrypoint. Repository scripts use native
  `import.meta` path properties instead of reconstructing them from URLs.
- The complete pedantic, style, restriction, and nursery categories remain
  outside this profile; `no-useless-assignment` is the only individually pinned
  nursery rule. Type-aware linting is also deferred: it requires the TypeScript
  7 toolchain, while the repository's Astro stack does not yet support that
  migration. Continue using `pnpm typecheck` as the semantic type gate until the
  migration is viable.
- API Extractor owns `packages/**/etc/*.api.md`; external formatting would make
  its byte-for-byte API report check fail, so these generated files are excluded
  from Oxfmt.
- Oxfmt does not currently load the Astro Prettier plugin, so `.astro` files use
  Prettier with `prettier-plugin-astro` as the only formatting exception.
  `astro check` remains responsible for Astro template and semantic checks.
- If an Oxlint warning is a false positive, cannot be fixed, or the fix would
  measurably harm a hot path or invalidate a benchmark, add the narrowest
  `oxlint-disable-next-line <rule> -- <reason>` directive at the affected line,
  or a paired `oxlint-disable`/`oxlint-enable` block when several adjacent
  statements share the same constraint. State the concrete reason and do not
  disable the rule globally. Unused suppressions fail `pnpm check:style`.
- `pnpm test:examples` is the production integration gate for every example in
  Chromium and Firefox. Paired framework implementations must also pass exact
  pixel-parity checks.
