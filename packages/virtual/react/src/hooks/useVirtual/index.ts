import {
    // oxlint-disable-next-line no-unused-vars -- The value import keeps api-extractor output stable even though TypeScript uses only the linked declaration.
    VirtualScroller,
    type VirtualScrollerInitialParams
} from "@af-utils/virtual-core";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";
import useVirtualModel from "../useVirtualModel";

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
