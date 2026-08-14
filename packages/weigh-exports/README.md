# @af-utils/weigh-exports

CLI for measuring raw, minified, gzip, and Brotli sizes of JavaScript package
exports.

## Installation

```bash
npm install --save-dev @af-utils/weigh-exports
```

Build the packages first, then pass one or more space-separated directory globs:

```bash
npx weigh-exports --input "packages/*" --output bundle-sizes.ts
```

The CLI reads each package's `exports`, prints a size table, and optionally
writes the results as a typed TypeScript module.

## Options

- `-i, --input <globs>`: required package-directory globs.
- `-o, --output <file>`: optional TypeScript output file.
- `-q, --quiet`: omit the console size tables.
