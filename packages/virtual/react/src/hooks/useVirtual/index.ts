import useVirtualModel from "hooks/useVirtualModel";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import type {
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
 *
 * @privateRemarks
 * TODO: convert to arrow function when https://github.com/microsoft/rushstack/issues/1629 gets solved
 */
function useVirtual(params: VirtualScrollerInitialParams): VirtualScroller {
    const model = useVirtualModel(params);

    useIsomorphicLayoutEffect(() => model.set(params));

    return model;
}

export default useVirtual;
