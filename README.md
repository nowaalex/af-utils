# af-utils/\*

Small open-source tools for browser and JavaScript performance work.

## [Virtual scroll](https://af-utils.com/virtual)

![Virtual scroll opengraph image](website/src/assets/og/virtual.png)

Render large collections while mounting only the visible range. Start with the
[framework setup](https://af-utils.com/virtual/frameworks), then open the
runnable example for your stack. Exact framework, browser, and TypeScript
support lives in the
[compatibility guide](https://af-utils.com/virtual/support).

### Common use cases

- [vertical](https://af-utils.com/virtual/examples/react/basics/simple-list) / [horizontal](https://af-utils.com/virtual/examples/react/basics/horizontal) / [grid](https://af-utils.com/virtual/examples/react/custom-layouts/grid) / [custom](https://af-utils.com/virtual/examples/react/custom-layouts/table) modes
- [dynamic item sizes](https://af-utils.com/virtual/examples/react/basics/variable-size)
- [sticky header and footer](https://af-utils.com/virtual/examples/react/basics/sticky-header-and-footer)
- [scrollToIndex method](https://af-utils.com/virtual/examples/react/scrolling/scroll-to-item)
- [load on demand](https://af-utils.com/virtual/examples/react/data-changes/load-on-demand)
- [window scroll](https://af-utils.com/virtual/examples/react/scrolling/window-scroll)
- [Material UI integration](https://af-utils.com/virtual/examples/react/integrations/material-ui)
- [React](https://af-utils.com/virtual/examples/react/basics/simple-list) / [Preact](https://af-utils.com/virtual/examples/preact/basics/simple-list) / [Solid](https://af-utils.com/virtual/examples/solid/basics/simple-list) / [Svelte](https://af-utils.com/virtual/examples/svelte/basics/simple-list) / [Lit](https://af-utils.com/virtual/examples/lit/basics/simple-list) / [Vue](https://af-utils.com/virtual/examples/vue/basics/simple-list) adapters

## [Scrollend polyfill](https://af-utils.com/scrollend-polyfill)

![Scrollend polyfill opengraph image](website/src/assets/og/scrollend-polyfill.png)

## Developer tools

- [`@af-utils/check-hot`](packages/check-hot/core/README.md) checks hot-path
  optimization assumptions against real JavaScript runtimes.
- [`@af-utils/weigh-exports`](packages/weigh-exports/README.md) measures the
  bundled impact of public package exports and feeds the website size reports.

## Contributing

Development workflow and repository rules live in [conventions.md](conventions.md).

```bash
pnpm nx run-many -t test typecheck
```
