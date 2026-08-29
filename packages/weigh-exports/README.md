# @af-utils/weigh-exports

CLI for measuring raw, minified, gzip, and Brotli sizes of JavaScript package
exports.

## Workspace use

This package is private workspace tooling and is not published to npm. The
website build invokes it through its workspace dependency.

Build the packages first, then pass one or more space-separated directory globs:

```bash
pnpm nx run @af-utils/weigh-exports:build
pnpm --dir website exec weigh-exports --input "../packages/virtual/* ../packages/scrollend-polyfill" --output bundle-sizes.ts
```

The CLI reads each package's `exports`, prints a size table, and optionally
writes the results as a typed TypeScript module.
The canonical production caller is
[website/build-bundle-sizes.mjs](../../website/build-bundle-sizes.mjs).

## Options

- `-i, --input <globs>`: required package-directory globs.
- `-o, --output <file>`: optional TypeScript output file.
- `-q, --quiet`: omit the console size tables.
