# af-utils website

The Astro documentation website for the af-utils packages and their standalone
examples.

## Development

Install dependencies from the repository root, then start the development
server:

```bash
pnpm --filter website dev
```

Build and validate the static website with:

```bash
pnpm --filter website build
```

API reference pages and bundle-size data are generated from the publishable
packages. Run `pnpm --filter website generate` after changing their public API
or build output.
