import { useRef } from "react";
import {
    VirtualScroller,
    type VirtualScrollerInitialParams
} from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Creates and stores one {@link @af-utils/virtual-core#VirtualScroller} instance.
 * It is not recreated during component lifecycle.
 *
 * @remarks
 * Normally {@link useVirtual} should be used.
 */
const useVirtualModel = (params: VirtualScrollerInitialParams) =>
    (useRef<VirtualScroller>().current ||= new VirtualScroller(params));

export default useVirtualModel;
