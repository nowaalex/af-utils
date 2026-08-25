import type { VirtualScroller } from "@af-utils/virtual-core";
import { createVirtualItemRef } from "@af-utils/virtual-solid";

declare const model: VirtualScroller;

createVirtualItemRef(model, 0);
