import type { VirtualScroller } from "@af-utils/virtual-core";
import { useVirtualItemRef, type ListProps } from "@af-utils/virtual-preact";

declare const model: VirtualScroller;
declare const props: ListProps;

useVirtualItemRef(model, 0);
void props;
