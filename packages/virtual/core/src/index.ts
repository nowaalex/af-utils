/**
 * @packageDocumentation
 * {@inheritDoc VirtualScroller}
 */

if (process.env.__IS_SERVER__) {
    global.ResizeObserver ||= class implements ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

export { default as VirtualScroller } from "models/VirtualScroller";
export { VirtualScrollerEvent } from "constants/";
export * from "./types";
