# Integration test conventions

Integration tests cover observable behavior of the built examples in Chromium and Firefox.

## Where a test belongs

- `examples/tests/all-examples.spec.ts` contains the hydration smoke test and cross-framework
  screenshot parity checks.
- A feature-specific contract belongs next to the example in its `tests/` directory.
- Reusable browser mechanics belong in this directory. Keep feature expectations in the spec so
  failures still explain which contract broke.

## Writing a feature contract

1. Name the test after one observable outcome.
2. Open examples with `openExample` so navigation, hydration, and uncaught page errors are checked
   consistently.
3. Prefer accessible roles and names. Use `data-testid` or data attributes for geometry that has no
   honest semantic equivalent.
4. Assert the public result of an interaction, not framework internals or an exact transient DOM
   shape.
5. Use Playwright's retrying assertions or `expect.poll` for asynchronous state. Use a fixed delay
   only when the timing itself is part of the regression scenario.
6. Run the same contract against every implementation exposed by the example.
7. Gate native scrollbar pointer tests with `requireNativeScrollbarPointer`; those tests intentionally
   run only in Chromium.

## Before submitting

Run the narrow spec while iterating, then run the complete production-build gate:

```sh
pnpm test:examples -- path/to/spec.ts --project=chromium
pnpm test:examples -- path/to/spec.ts --project=firefox
pnpm test:examples
```

Use the Nx-backed command above even for a narrow run: it rebuilds the production examples and
website before Playwright starts, avoiding tests against stale output.

When adding an example, confirm that it is discovered by the smoke test. Add a colocated contract if
the example demonstrates behavior that is not already asserted elsewhere.
