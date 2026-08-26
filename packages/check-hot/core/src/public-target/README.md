# Public target identity

> **Change Contract**
>
> - **Responsibility:** represent a public callable by structured module and
>   export paths across analyzer, manifest, worker, and report boundaries.
> - **Boundary:** target identity must not be parsed from display strings or
>   reduced to a local function name.
> - **Invariants:** locators round-trip without ambiguity and preserve nested
>   export paths and receiver requirements.
> - **Configuration owner:** [index.ts](./index.ts) owns the locator schema,
>   formatting, and parsing rules.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## Problem

A package may export different functions with the same local name:

```js
import { hot } from "library";
import { hot as featureHot } from "library/feature";
```

Using only `"hot"` as a manifest key silently overwrites one function. Parsing a
display string such as `./feature:hot` is also unsafe because export names may
contain punctuation.

## Contract

The analyzer and runtime exchange a structured locator:

```ts
{ modulePath: "./feature", exportPath: ["hot"] }
```

`hotPublicTargetId()` produces a stable scenario/manifest key. The root's
one-segment IDs stay concise (`hot`); subpaths are qualified
(`./feature::hot`), and nested root paths remain unambiguous
(`.::MathUtils/lerp`). A root export containing the reserved `::` separator is
escaped, so it cannot collide with a qualified subpath.
`hotObligationTargetId()` always prefers the structured locator and uses a
direct `exportName` only for a manually authored obligation with no locator;
display-name coincidence can never attach engine evidence to another public
subpath.
`resolveHotPublicFunction()` follows own data properties only, so discovery
does not invoke user getters. External adapters return locators, never trusted
function/receiver pairs.

## Good practice

Keep the locator structured in evidence and obligations. Use the string ID only
as a map/scenario key, and authenticate the module entry before resolving the
callable. Package-specific export names never belong in this module.
