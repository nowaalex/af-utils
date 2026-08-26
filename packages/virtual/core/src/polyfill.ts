/** Install the inert ResizeObserver required by server-side model construction. */
export const installResizeObserverPolyfill = () => {
    globalThis.ResizeObserver ||= class {
        /** Ignore a server-side observation request. */
        observe() {}

        /** Ignore a server-side unobserve request. */
        unobserve() {}

        /** Ignore a server-side disconnect request. */
        disconnect() {}
    };
};
