import useVirtualModel from "hooks/useVirtualModel";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import {
    // this unused import is needed for normal api-extractor output
    VirtualScroller,
    VirtualScrollerInitialParams
} from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Calls {@link useVirtualModel} and synchronizes it with props
 *
 * @remarks
 * {@link @af-utils/virtual-core#VirtualScroller.set} is called internally to syncchronize model with props.
 *
 * @example
 * ```tsx
 * useVirtual({
 *     itemCount: 1000,
 *     estimatedItemSize: 100,
 *     overscanCount: 1
 * });
 * ```
 */
const useVirtual = (params: VirtualScrollerInitialParams) => {
    const model = useVirtualModel(params);

    useIsomorphicLayoutEffect(() => model.set(params));

    return model;
};

export default useVirtual;
