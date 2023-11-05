class TestResizeObserver implements ResizeObserver {
    private flushTimer: ReturnType<typeof setTimeout> | 0 = 0;
    private callback: ResizeObserverCallback;
    private queue: Element[] = [];

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }

    private flush() {
        const entries = this.queue.flatMap<ResizeObserverEntry>(el => {
            if (el instanceof HTMLElement) {
                const testSize = el.dataset.testSize;

                if (testSize) {
                    const numericSize = Number.parseInt(testSize, 10);

                    if (!Number.isNaN(numericSize)) {
                        const sizeArray = [
                            {
                                blockSize: numericSize,
                                inlineSize: numericSize
                            }
                        ];

                        return [
                            {
                                target: el,
                                borderBoxSize: sizeArray,
                                contentBoxSize: sizeArray,
                                devicePixelContentBoxSize: sizeArray,
                                contentRect: el.getBoundingClientRect()
                            }
                        ];
                    }
                }
            }

            return [];
        });

        if (entries.length) {
            this.callback(entries, this);
        }

        this.queue = [];
    }

    observe(target: Element) {
        this.queue.push(target);
        clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(() => this.flush(), 0);
    }

    unobserve(target: Element) {}
    disconnect() {}
}

export default TestResizeObserver;
