---
title: "Function: createVirtualLayout()"
description: Connect Svelte attachments to the framework-neutral virtual layout adapter.
package: "@af-utils/virtual-svelte"
symbol: createVirtualLayout
kind: function
referencePath: /virtual/reference/virtual-svelte/functions/createVirtualLayout
generated: true
---

# createVirtualLayout()

```ts
function createVirtualLayout(model): VirtualSvelteLayoutBinding;
```

Connect Svelte attachments to the framework-neutral virtual layout adapter.

## Parameters

### model

[`VirtualScroller`](/virtual/reference/virtual-core/classes/VirtualScroller)

## Returns

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding)

## Remarks

Call this helper during Svelte component initialization.
See the [layout-elements guide](/virtual/guides/layout-elements) for the
required nesting.
