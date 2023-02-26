const FinalResizeObserver =
    process.env.__IS_SERVER__ || process.env.NODE_ENV === "test"
        ? class {
              observe() {}
              unobserve() {}
              disconnect() {}
          }
        : window.ResizeObserver;

export default FinalResizeObserver;
