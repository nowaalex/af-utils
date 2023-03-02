const FinalResizeObserver =
    process.env.__IS_SERVER__ || process.env.NODE_ENV === "test"
        ? class {
              constructor(callback: ResizeObserverCallback) {}
              observe() {}
              unobserve() {}
              disconnect() {}
          }
        : ResizeObserver;

export default FinalResizeObserver;
