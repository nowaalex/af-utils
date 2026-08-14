---
title: "Interface: VirtualSvelteListBinding"
description: Reactive range and layout attachments for a virtual list.
package: "@af-utils/virtual-svelte"
symbol: VirtualSvelteListBinding
kind: interface
referencePath: /virtual/reference/virtual-svelte/interfaces/VirtualSvelteListBinding
generated: true
---

# VirtualSvelteListBinding

Reactive range and layout attachments for a virtual list.

## Extends

- [`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding)

## Properties

### items

```ts
items: Attachment<HTMLElement>;
```

Attachment for the [rendered-items element](/virtual/guides/layout-elements#items-ref).

#### Inherited from

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`items`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#items)

---

### range

```ts
range: VirtualSvelteValue<number[]>;
```

Reactive array containing the currently rendered indexes.

---

### scroller

```ts
scroller: Attachment<HTMLElement>;
```

Attachment for the [scroller element](/virtual/guides/layout-elements#scroller-ref).

#### Inherited from

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`scroller`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#scroller)

---

### size

```ts
size: Attachment<HTMLElement>;
```

Attachment for the [native size element](/virtual/guides/layout-elements#size-ref).

#### Inherited from

[`VirtualSvelteLayoutBinding`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding).[`size`](/virtual/reference/virtual-svelte/interfaces/VirtualSvelteLayoutBinding#size)
