# V8 code-creation locations

> **Change Contract**
>
> - **Responsibility:** derive the exact V8 code-creation coordinate for an
>   authenticated JavaScript function node.
> - **Boundary:** coordinates must not widen to a function span or rely on a
>   display name when the engine reports a narrower location.
> - **Invariants:** every supported syntax kind is backed by real-engine
>   controls and unsupported syntax remains an explicit correlation gap.
> - **Configuration owners:** [derive.ts](./derive.ts) owns derivation;
>   [derive.test.ts](./derive.test.ts) owns admitted syntax controls.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

V8's optional IC/Map log identifies a JavaScript function by a code-creation
source coordinate. That coordinate is not the start of the function AST node:
for ordinary functions and methods V8 reports the opening parameter `(`, a
bare single-parameter arrow is reported at the parameter itself, and an async
arrow is reported at its `async` keyword.

## Bad practice

Treating the full owner span, function keyword, or a name match as equivalent
can attribute a nested or same-named function's IC transition to the public
target:

```js
const publicTarget = function (value) {
    return function nested(value) {
        return value.key;
    };
};
```

## Checked practice

The analyzer derives a versioned locator from the Oxc function node and stores
its syntax kind, anchor kind, exact one-based line/column, and complete source
SHA-256. The V8 oracle accepts only an exact source-path and locator match on a
registered, real-engine-tested log fingerprint. Unsupported syntax or engine
versions produce a non-gating diagnostic gap; they never fall back to a wider
owner range.

The compatibility registry is currently Linux-scoped and exercised by the
required real-runtime worker gate on Node 20/24 and by checked Linux controls
on Node 26 and Deno 2.9. Other platforms remain an explicit diagnostic gap
until their path/log behavior has the same control. The fixture
covers declarations, named and anonymous expressions, parenthesized and bare
arrows, object/class methods, getters, setters, async/generator forms, and an
astral character before a same-line anchor. Adding a new engine fingerprint or
syntax family requires extending that real-runtime control first.

The coordinate proves the owning runtime function, not the exact AST operation
inside it. IC transitions therefore remain target-correlated advisory evidence.
