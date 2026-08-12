import {
    VirtualScroller,
    type VirtualScrollerInitialParams
} from "@af-utils/virtual-core";
import { createRenderEffect, onCleanup } from "solid-js";
import type { MaybeAccessor } from "../../types";
import readAccessor from "../../utils/readAccessor";

/**
 * Create a Solid-owned `VirtualScroller` and synchronize reactive parameters.
 *
 * @public
 * @example
 * ```tsx
 * const model = createVirtual(() => ({
 *     itemCount: count(),
 *     estimatedItemSize: 40
 * }));
 * ```
 */
const createVirtual = (params: MaybeAccessor<VirtualScrollerInitialParams>) => {
    const initialParams = readAccessor(params);
    const model = new VirtualScroller(initialParams);
    let initialized = false;

    createRenderEffect(() => {
        const nextParams = readAccessor(params);

        if (initialized) model.set(nextParams);
        else initialized = true;
    });
    onCleanup(() => model.dispose());

    return model;
};

export default createVirtual;
