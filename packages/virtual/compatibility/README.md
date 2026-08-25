# Virtual adapter compatibility

> **Change contract**
>
> - **Responsibility:** prove that every virtual adapter works at every lower
>   bound advertised in its `peerDependencies`.
> - **Boundary:** this package checks packed public packages. Adapter unit tests
>   and example tests still own detailed behavior and cross-browser coverage.
> - **Invariants:** package manifests own the supported ranges; each range floor
>   must install strictly, expose usable public types to TypeScript 6, import in
>   Node, and keep its framework binding lifecycle working in Chromium. One
>   combined fixture must also accept every adapter's public types in
>   TypeScript 7.
> - **Configuration owners:** adapter `package.json` files define versions;
>   `scripts/contract.mjs` defines which public surface each adapter must expose.
> - **Targeted check:**
>   `pnpm nx run @af-utils/virtual-compatibility:compat`.

This package answers a small but important question: “If a user installs the
oldest framework version we claim to support, does the published package still
work?”

The check follows the same path as a real user:

1. It packs the core and adapters into npm tarballs.
2. It creates one temporary pnpm workspace and installs each framework floor
   with strict peer-dependency checks.
3. It checks the public declarations with TypeScript 6, the Node export, and
   one small browser lifecycle for every adapter.
4. It checks all adapters together once with TypeScript 7.

Why both compilers? Packages are built with the fast TypeScript 7 CLI, but
Astro, Vue, Svelte, and other tools that embed the compiler still need the
TypeScript 6 API. Testing both sides proves that the generated declarations
work for old and new tooling without multiplying the entire framework matrix.

There is no second list of version numbers here. The runner reads the floors
directly from each adapter's `peerDependencies`, so changing a support promise
automatically changes the test matrix.

This is intentionally not an examples package. Examples explain features using
the current framework versions; this package protects the installation promise
made to package consumers.

Development and task ownership follow the
[repository conventions](../../../conventions.md).
