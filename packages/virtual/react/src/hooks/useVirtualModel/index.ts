import { useRef } from "react";
import {
    VirtualScroller,
    VirtualScrollerInitialParams
} from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Creates and stores one {@link @af-utils/virtual-core#VirtualScroller} instance.
 * It does not get recreated during component lifecycle.
 * Normally {@link useVirtual} should be used.
 * @param params - {@link @af-utils/virtual-core#VirtualScrollerInitialParams}
 * @returns same {@link @af-utils/virtual-core#VirtualScroller} instance
 */
const useVirtualModel = (params: VirtualScrollerInitialParams) =>
    (useRef<VirtualScroller>().current ||= new VirtualScroller(params));

export default useVirtualModel;
