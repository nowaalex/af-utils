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
 * 
 * @remarks
 * Normally {@link useVirtual} should be used.
 */
const useVirtualModel = (
    params: VirtualScrollerInitialParams
): VirtualScroller => (useRef<VirtualScroller>().current ||= new VirtualScroller(params));

export default useVirtualModel;
