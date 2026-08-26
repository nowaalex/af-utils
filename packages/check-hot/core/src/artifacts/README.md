# Offline-inspectable artifact bundles

> **Change Contract**
>
> - **Responsibility:** persist an inspectable bundle of primary results,
>   diagnostics, commands, event streams, and file integrity metadata.
> - **Boundary:** a bundle must not claim hermetic replay, redact implicitly, or
>   treat an unsigned inventory as proof against a malicious bundle author.
> - **Invariants:** bundle creation is exclusive, the manifest accounts for
>   every retained file, and sensitive raw evidence remains explicit.
> - **Configuration owners:** [index.ts](./index.ts) owns the format and
>   [streaming.test.ts](./streaming.test.ts) owns bounded-write controls.
> - **Targeted check:** `pnpm nx run @af-utils/check-hot:test`.

Artifact bundles separate collection from interpretation. `check-hot run
--artifacts <new-directory>` writes the exact primary summary, per-cell command,
stdout/stderr, event streams, optional raw V8/CPU profiles, runtime/oracle
versions, and SHA-256 file inventory. The configured environment map is not
copied into the manifest. Raw stdout, stderr, commands, paths, target values,
and engine logs are intentionally unredacted and may contain secrets; treat the
bundle as sensitive before uploading it.

The inventory detects missing, added, or modified files relative to the
manifest. The manifest is not cryptographically signed: obtain it through a
trusted channel when the bundle may be controlled by an attacker. A malicious
party able to rewrite both a file and its manifest hash can forge a
self-consistent bundle.

The bundle retains a reproduction command but is not deterministic replay: it
does not snapshot the executable, operating system, environment, external
services, or container. True hermetic replay is future work.

```sh
check-hot run suite.mjs --artifacts .check-hot/run-001
check-hot report .check-hot/run-001 --verbose
```

The second command reads JSON and logs only. It does not import or execute the
suite. Collection uses OS temporary space outside the inspected target tree.
After the manifest is complete, files are copied into a same-filesystem sibling
publication directory and made visible with one final atomic rename. The
requested destination must not already exist, preventing unrelated evidence
from being silently mixed or overwritten.

Inventory creation and offline integrity verification stat each regular file
before hashing it and stream its bytes through SHA-256. Retained raw V8 logs and
CPU profiles therefore are not loaded into one in-memory `Buffer` merely to
build or verify the inventory. Structured summary, command, event, stdout, and
stderr files are read separately when the offline report hydrates them; raw
diagnostic locators are validated against the inventory but are not hydrated.

## Diagnostic artifacts

```sh
check-hot run suite.mjs \
  --artifacts .check-hot/run-002 \
  --diagnostics v8-ic-maps,cpu-profile
```

Diagnostic reruns are separate processes. Their profiles and logs can explain
or prioritize a primary failure but never change its tier, deoptimization,
coverage, or pass/fail result.
