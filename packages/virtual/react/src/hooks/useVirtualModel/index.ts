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
 *
 * @privateRemarks
 * TODO: convert to arrow function when https://github.com/microsoft/rushstack/issues/1629 gets solved
 */
function useVirtualModel(
    params: VirtualScrollerInitialParams
): VirtualScroller {
    return (useRef<VirtualScroller>().current ||= new VirtualScroller(params));
}

export default useVirtualModel;
