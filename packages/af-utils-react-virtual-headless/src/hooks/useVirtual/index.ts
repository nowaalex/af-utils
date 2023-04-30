import useVirtualModel from "hooks/useVirtualModel";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import type { VirtualScrollerInitialParams } from "models/VirtualScroller";

const useVirtual = (params: VirtualScrollerInitialParams) => {
    const model = useVirtualModel(params);

    useIsomorphicLayoutEffect(() => model.set(params));

    return model;
};

export default useVirtual;
