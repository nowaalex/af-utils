import {
    VirtualScroller,
    type VirtualScrollerInitialParams
} from "@af-utils/virtual-core";
import { useEffect, useRef } from "react";
import useIsomorphicLayoutEffect from "../useIsomorphicLayoutEffect";

interface VirtualModelResource {
    model: VirtualScroller;
    ownershipRevision: number;
}

/** Create one StrictMode-safe model owned by the current component. */
const useVirtualModel = (params: VirtualScrollerInitialParams) => {
    const resourceRef = useRef<VirtualModelResource | null>(null);
    resourceRef.current ??= {
        model: new VirtualScroller(params),
        ownershipRevision: 0
    };
    const resource = resourceRef.current;

    useEffect(() => {
        const ownershipRevision = ++resource.ownershipRevision;
        return () => {
            queueMicrotask(() => {
                if (resource.ownershipRevision === ownershipRevision) {
                    resource.model.dispose();
                }
            });
        };
    }, [resource]);

    return resource.model;
};

/**
 * @public
 * React hook.
 * Owns one `VirtualScroller` and synchronizes it with props.
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

    useIsomorphicLayoutEffect(() => {
        model.set(params);
    });

    return model;
};

export default useVirtual;
