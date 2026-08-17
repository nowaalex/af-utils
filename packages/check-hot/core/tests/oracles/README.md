# Runtime oracle controls

These tests prove facts that an AST cannot prove by itself.

- `runtime-workers.test.ts` checks optimizer tiers, deoptimizations, exact-site
  coverage, lifecycle phases, and hard timeouts in real engines.
- `runtime-resolution.test.ts` compares the analyzer's selected `import` and
  `require` artifacts with modules actually loaded by the installed Node, Deno,
  and Bun versions. It covers conditional exports, legacy `main`/`module`
  selection, and Bun's extension priority.
- `engine-semantics.test.ts` and `invocation-phases.test.ts` keep shared oracle
  interpretation and phase accounting deterministic.

CI sets `CHECK_HOT_REQUIRE_RUNTIMES`; a missing required executable is a failure,
not a skipped green control. AST-only tests remain useful negative controls, but
they cannot replace these native parity checks.
