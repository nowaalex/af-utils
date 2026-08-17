# Runtime module graph

This folder answers one narrow question: which files can the selected runtime
reach from the requested package entry without executing user code?

It uses Oxc's parsed ESM metadata plus AST nodes for literal dynamic imports,
CommonJS `require`, TypeScript `import = require`, and top-level
`createRequire`. Resolution remains delegated to `oxc-resolver`; this code does
not reimplement a parser or package resolver.

- `requests.ts` extracts and de-duplicates literal runtime edges.
- `index.ts` owns the bounded package-local traversal and boundary ledger.

## Bad assumption

```js
// package-a/index.js
export { hot } from "package-b";
```

Treating `package-b` as if it belonged to package A makes source hashes depend
on package-manager layout and can falsely claim that package B was analyzed.

## Contract used instead

The selected artifact is recorded as an `externalBoundary` with its literal
specifier, `import`/`require` mode, package/version, and package-relative file.
Package A's report does not claim AST or source-integrity coverage for package
B, so the complete-graph flag is false rather than silently trusting that
boundary. A test-runner is stricter: runtime dependencies must be bundled,
because an old probe manifest must never replay against changed recipe code.

Nonliteral imports/requires and unresolved package-local edges make the graph
incomplete. Built-ins are terminal. JSON/native/Wasm assets are authenticated
but not parsed as JavaScript.

The synthetic resolver cases live in `tests/ast/graph.test.ts`; native parity
against installed Node, Deno, and Bun lives in
`tests/oracles/runtime-resolution.test.ts`.
