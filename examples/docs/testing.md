# Example browser and cross-framework testing

> **Change Contract**
>
> - **Responsibility:** verify that every generated example route hydrates and
>   that equivalent framework implementations remain behaviorally aligned.
> - **Boundary:** shared behavior belongs in group-level tests; browser mechanics
>   must not duplicate feature expectations or framework internals.
> - **Invariants:** all routes receive smoke coverage, comparable implementations
>   receive deterministic pixel checks, and unsupported interactions are gated
>   explicitly instead of silently skipped.
> - **Configuration owners:** [playwright.config.ts](../../playwright.config.ts),
>   [src/e2e](../src/e2e/), and colocated group-level `tests` directories.
> - **Targeted check:** `pnpm nx run @af-utils/examples:e2e`.

`pnpm nx run @af-utils/examples:build` validates every standalone package as one
cached Nx task. `pnpm nx run @af-utils/examples:e2e` builds the production
documentation site before running the integration suite in Chromium, Firefox,
and WebKit.

Every route gets a hydration and uncaught-error smoke test. Groups with multiple
frameworks also get exact screenshot comparison; keep generated data
deterministic so pixel differences represent real rendering differences.

Tests for behavior shared by all implementations belong in the group-level
`tests` directory and use `describeExample` to run once per framework. Reusable
browser mechanics belong in [src/e2e](../src/e2e/).

Native scrollbar pointer tests run in Chromium because headless Firefox exposes
overlay scrollbars that Playwright cannot drag. Route, hydration, error,
programmatic scrolling, and pixel-parity checks still run in every browser where
the interaction is supported.
