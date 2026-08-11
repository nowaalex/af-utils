# af-utils/\*

Simple open-source tools that just work _(usually fast)_

## [Virtual scroll](https://af-utils.com/virtual)

![Virtual scroll opengraph image](website/src/assets/og/virtual.png)

### Features

The React adapter targets React 19.2+. Older React versions are not supported.

-   [vertical](https://af-utils.com/virtual/examples/react/list/simple) / [horizontal](https://af-utils.com/virtual/examples/react/list/horizontal) / [grid](https://af-utils.com/virtual/examples/react/hook/grid) / [custom](https://af-utils.com/virtual/examples/react/hook/custom-render) modes
-   [dynamic item sizes](https://af-utils.com/virtual/examples/react/list/variable-size-list)
-   [sticky header and footer](https://af-utils.com/virtual/examples/react/list/sticky-header-and-footer)
-   [scrollToIndex method](https://af-utils.com/virtual/examples/react/list/scroll-to-item)
-   [load on demand](https://af-utils.com/virtual/examples/react/list/load-on-demand)
-   [window scroll](https://af-utils.com/virtual/examples/react/hook/window-scroll)
-   [material-ui](https://af-utils.com/virtual/examples/react/list/material-ui) / [bootstrap](https://af-utils.com/virtual/examples/react/list/bootstrap) integration

## [Scrollend polyfill](https://af-utils.com/scrollend-polyfill)

![Scrollend polyfill opengraph image](website/src/assets/og/scrollend-polyfill.png)

## Repository conventions

- Every production TypeScript class method, constructor, getter, setter, interface method signature, and method-like callback field must have a TSDoc comment, including private and package-internal members.
- Use `/** ... */`; ordinary implementation comments do not replace API documentation.
- Prefix class members and object properties with `_` when they are internal runtime implementation details so esbuild can mangle them.
- Do not prefix ordinary functions with `_`; local identifiers are already shortened by identifier minification.
- Create repository worktrees only inside the root `./git-worktrees/` directory.
