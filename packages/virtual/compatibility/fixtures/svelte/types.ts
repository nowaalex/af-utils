import type { VirtualScroller } from "@af-utils/virtual-core";
import { virtualItem } from "@af-utils/virtual-svelte";

declare const model: VirtualScroller;

virtualItem(model, 0);
