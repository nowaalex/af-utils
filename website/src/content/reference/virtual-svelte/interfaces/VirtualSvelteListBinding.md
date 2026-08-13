---
title: "Interface: VirtualSvelteListBinding"
description: Range store and layout actions for the common virtual-list shape.
package: "@af-utils/virtual-svelte"
symbol: VirtualSvelteListBinding
kind: interface
referencePath: /virtual/reference/virtual-svelte/interfaces/VirtualSvelteListBinding
generated: true
---

# VirtualSvelteListBinding

Range store and layout actions for the common virtual-list shape.

## Extends

- [`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding)

## Properties

### items

```ts
items: Action<HTMLElement>;
```

Action attaching the [rendered-items element](/virtual/guides/layout-elements#items-ref).

#### Inherited from

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`items`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#items)

---

### range

```ts
range: Readable<number[]>;
```

Readable array containing the currently rendered indexes.

---

### scroller

```ts
scroller: Action<HTMLElement>;
```

Action attaching the [scroller element](/virtual/guides/layout-elements#scroller-ref).

#### Inherited from

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`scroller`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#scroller)

---

### size

```ts
size: Action<HTMLElement>;
```

Action attaching the [native size element](/virtual/guides/layout-elements#size-ref).

#### Inherited from

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`size`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#size)
