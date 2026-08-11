import { useRef } from "react";
import {
    VirtualScroller,
    type VirtualScrollerInitialParams
} from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Creates and stores exactly one `VirtualScroller` instance.
 * It is not recreated during component lifecycle.
 *
 * @remarks
 * Normally {@link useVirtual} should be used.
 */
const useVirtualModel = (params: VirtualScrollerInitialParams) =>
    (useRef<VirtualScroller | null>(null).current ||= new VirtualScroller(
        params
    ));

export default useVirtualModel;
