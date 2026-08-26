# Runtime worker liveness

> **Change Contract**
>
> - **Responsibility:** validate process completion, cleanup, result-envelope
>   integrity, and terminal accounting for every runtime matrix cell.
> - **Boundary:** a crash, timeout, malformed result, or cleanup failure must not
>   be reported as target-code performance evidence.
> - **Invariants:** each cell runs in a fresh process group, emits one matching
>   versioned result, and leaves every obligation in a terminal state.
> - **Configuration owners:** [check.ts](./check.ts) owns validation;
>   [problem.ts](./problem.ts) owns infrastructure failures.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

## Problem

A timeout, crash, unsupported flag, failed process-tree cleanup, or missing,
duplicated, malformed, or request-inconsistent structured result means no
engine claim can be trusted. It is a proof gap or infrastructure failure, not
evidence that the inspected library is slow.

```js
// A synchronous hang defeats Promise.race inside the same process.
export function sample() {
    while (true) {}
}
```

## Better practice

Run every matrix cell in a fresh process group, apply a hard wall-clock timeout,
retain the exact command, and give every obligation a terminal non-pass outcome.
One versioned result envelope must bind to the exact request and account for
every obligation required by a successful measurement.

```text
parent process -> fresh OS containment -> bounded cleanup -> structured problem
```

## Implementation

`check.ts` classifies timeout, invalid/missing result, cleanup, exit-status, and
uncategorized worker-execution problems. `process-execution.ts` owns bounded
process-tree cleanup after success, timeout, and output overflow. POSIX workers
use a fresh process group. Windows starts a protocol-paused wrapper, assigns it
to a non-breakaway Job Object before it can create the runtime worker, and uses
kill-on-close as a final containment guard. The live protocol accepts exactly
one schema-valid envelope whose request ID, runtime, tier, mode, purpose,
scenarios, engine, oracle, and target tier match the orchestrator request. Tests
include forged duplicate results, descendants, output overflow, and inherited
pipes that must not extend the cleanup deadline.

On POSIX, the containment boundary is the worker process group. A measured suite
must not create a detached session (`setsid` or Node `detached: true`), because
that explicitly leaves the portable process-group boundary. Windows Job Objects
do not permit this breakaway. Code that intentionally escapes OS containment
requires a stronger external sandbox.

The trust boundary is a correct-but-possibly-buggy suite. The request envelope
detects accidental corruption and stale or duplicated output; it is not an
authentication mechanism against deliberately hostile code already executing
inside the measured worker. Such code requires an operating-system sandbox.
