---
title: "Interface: VirtualSvelteLayoutBinding"
description: Svelte actions for the three elements explained in the layout-elements guide.
package: "@af-utils/virtual-svelte"
symbol: VirtualSvelteLayoutBinding
kind: interface
referencePath: /virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding
generated: true
---

# VirtualSvelteLayoutBinding

Svelte actions for the three elements explained in the
[layout-elements guide](/virtual/guides/layout-elements).

## Extended by

- [`VirtualSvelteListBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteListBinding)

## Properties

### items

```ts
items: Action<HTMLElement>;
```

Action attaching the [rendered-items element](/virtual/guides/layout-elements#items-ref).

---

### scroller

```ts
scroller: Action<HTMLElement>;
```

Action attaching the [scroller element](/virtual/guides/layout-elements#scroller-ref).

---

### size

```ts
size: Action<HTMLElement>;
```

Action attaching the [native size element](/virtual/guides/layout-elements#size-ref).
