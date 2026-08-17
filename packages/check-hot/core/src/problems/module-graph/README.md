# Runtime module graph completeness

## Problem

If a dynamic import, `require`, package export, or resolver-sensitive edge cannot
be enumerated, the analyzer cannot honestly claim that all executable source was
inspected.

```js
// Not statically enumerable: the runtime edge depends on arbitrary input.
await import(`./plugins/${name}.js`);
```

## Better practice

Use literal, runtime-resolvable edges where possible or provide an explicit
manual boundary. Automatic suite generation refuses an incomplete graph unless
the user consciously accepts it.

```js
const plugins = { json: () => import("./plugins/json.js") };
await plugins[name]();
```

## Implementation

The Oxc-backed graph is built under `analyzer/graph`. `check.ts` turns the final
completeness bit and diagnostics into a stable problem for reports and the
catalog; it does not duplicate resolution logic.
