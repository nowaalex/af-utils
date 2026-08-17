---
"@af-utils/check-hot": patch
---

Reject malformed, duplicated, stale, and request-inconsistent worker results,
propagate process-tree cleanup failures, and bound worker cleanup to the complete
OS containment with POSIX process groups and Windows Job Objects.
