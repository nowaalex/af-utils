# Runtime worker liveness

## Problem

A timeout, crash, unsupported flag, or missing structured result means no engine
claim can be trusted. It is a proof gap or infrastructure failure, not evidence
that the inspected library is slow.

```js
// A synchronous hang defeats Promise.race inside the same process.
export function sample() {
    while (true) {}
}
```

## Better practice

Run every matrix cell in a fresh process, apply a hard wall-clock timeout, retain
the exact command, and give every obligation a terminal non-pass outcome.

```text
parent process -> fresh worker -> hard timeout/SIGKILL -> structured problem
```

## Implementation

`check.ts` classifies timeout, missing-result, exit-status, and uncategorized
worker-execution problems. Process creation and `SIGKILL` remain shared in
`runner.ts`. Tests include a worker that ignores ordinary progress and must be
terminated by the orchestrator.
