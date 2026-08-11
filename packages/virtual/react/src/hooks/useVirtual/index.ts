import useVirtualModel from "../useVirtualModel";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";
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
 * `VirtualScroller.set()` is called internally to synchronize the model with props.
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

    useIsomorphicLayoutEffect(
        () => model.set(params),
        [
            model,
            params.estimatedItemSize,
            params.itemCount,
            params.overscanCount
        ]
    );

    return model;
};

export default useVirtual;
