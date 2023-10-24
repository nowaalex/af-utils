import useVirtualModel from "hooks/useVirtualModel";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import type { VirtualScrollerInitialParams } from "@af-utils/virtual-core";

/**
 * @public
 * React hook.
 * Calls {@link useVirtualModel} and synchronizes it with props
 * @param params - {@link @af-utils/virtual-core#VirtualScrollerInitialParams}
 * @returns same {@link @af-utils/virtual-core#VirtualScroller} instance
 *
 * @privateRemarks
 * TODO: convert to arrow function when https://github.com/microsoft/rushstack/issues/1629 gets solved
 */
function useVirtual(params: VirtualScrollerInitialParams) {
    const model = useVirtualModel(params);

    useIsomorphicLayoutEffect(() => model.set(params));

    return model;
}

export default useVirtual;
