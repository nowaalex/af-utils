class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

export default typeof ResizeObserver === "undefined"
    ? FakeResizeObserver
    : ResizeObserver;
