# af-utils website

The Astro documentation website for the af-utils packages and their standalone
examples.

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
packages. Run `pnpm nx run website:generate` after changing their public API or
build output.
