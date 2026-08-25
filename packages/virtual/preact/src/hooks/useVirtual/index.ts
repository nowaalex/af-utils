import {
    VirtualScroller,
    type VirtualScrollerInitialParams
} from "@af-utils/virtual-core";
import { useEffect, useLayoutEffect, useRef } from "preact/hooks";

const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Create and retain exactly one Preact-owned virtual-scroller model. */
const useVirtualModel = (params: VirtualScrollerInitialParams) => {
    const model = (useRef<VirtualScroller | null>(null).current ??=
        new VirtualScroller(params));
    useEffect(() => () => model.dispose(), [model]);
    return model;
};

/**
 * Create a Preact-owned virtual-scroller model and synchronize its parameters.
 *
 * @public
 */
const useVirtual = (params: VirtualScrollerInitialParams) => {
    const model = useVirtualModel(params);

    useIsomorphicLayoutEffect(() => {
        model.set(params);
    });
    return model;
};

export { useIsomorphicLayoutEffect };
export default useVirtual;
