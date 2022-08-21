const FinalResizeObserver = process.env.__IS_SERVER__
    ? class {
          observe() {}
          unobserve() {}
          disconnect() {}
      }
    : ResizeObserver;

export default FinalResizeObserver;
