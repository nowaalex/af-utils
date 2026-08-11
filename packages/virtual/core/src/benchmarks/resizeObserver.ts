/** Resize observer whose deliveries are controlled directly by benchmarks. */
class BenchmarkResizeObserver implements ResizeObserver {
    /** Ignore DOM observation because benchmark entries are delivered directly. */
    observe() {}

    /** Ignore removal because no DOM observations are registered. */
    unobserve() {}

    /** Ignore cleanup because the observer owns no resources. */
    disconnect() {}
}

globalThis.ResizeObserver = BenchmarkResizeObserver;
