# af-utils website

> **Change Contract**
>
> - **Responsibility:** build the public documentation, runnable example pages,
>   generated API reference, bundle-size reports, and production search index.
> - **Boundary:** package source and example groups own facts; the website links,
>   renders, or generates them instead of maintaining parallel copies.
> - **Invariants:** production routes are prerendered, examples use the shared
>   discovery contract, and ignored generated data is reproducible through Nx.
> - **Configuration owners:** `website/package.json` owns the task graph,
>   `astro.config.ts` owns rendering integrations, and package/example sources
>   own published content.
> - **Targeted check:** `pnpm nx run website:build`.

The Astro documentation website for the af-utils packages and their standalone
examples.
It publishes at [af-utils.vercel.app](https://af-utils.vercel.app/).

## Development

Install dependencies from the repository root, then start the development
server:

```bash
pnpm nx run website:dev
```

Build and validate the static website with:

```bash
pnpm nx run website:build
```

API reference pages and bundle-size data are generated from the publishable
packages into the ignored `website/.generated` directory. Run
`pnpm nx run website:generate` after changing their public API or build output;
only API Extractor reports under `packages/**/etc` remain tracked.

The production build indexes the rendered HTML with Pagefind. Browser tests
cover search, accessibility, and examples in Chromium, Firefox, and WebKit;
`pnpm nx run workspace:lighthouse` enforces the checked-in Lighthouse score and
resource budgets against the production preview.
