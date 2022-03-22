class FakeResizeObserver {
    observe() {}
    unobserve() {}
}

export default globalThis.ResizeObserver || FakeResizeObserver;
