/** Measure the rendered border box because it is the space occupied in layout. */
const OBSERVE_OPTIONS = {
    box: "border-box"
} as const satisfies ResizeObserverOptions;

/**
 * Owns rendered-item element indexes and their resize-observation lifecycle.
 *
 * @remarks New observations can be deferred until the next animation frame so
 * subscribers may replace the rendered range without extending the active
 * `ResizeObserver` delivery.
 */
class ItemElements {
    /** Item index associated with every currently attached element. */
    private _elementIndexes = new WeakMap<Element, number>();

    /** Attached elements waiting for a safe observation boundary. */
    private readonly _pendingObservations = new Set<Element>();

    /** Frame that starts observations deferred from a resize delivery. */
    private _observationFrame: number | null = null;

    /** Observer that publishes rendered-item resize deliveries. */
    private readonly _resizeObserver: ResizeObserver;

    /** Create item-element ownership around one resize-delivery callback. */
    constructor(onResize: (entries: readonly ResizeObserverEntry[]) => void) {
        this._resizeObserver = new ResizeObserver(onResize);
    }

    /** Return the current item index for an observed entry target. */
    _getIndex(element: Element) {
        return this._elementIndexes.get(element);
    }

    /** Attach an item element and start or defer its size observation. */
    _attach(element: HTMLElement, index: number) {
        this._elementIndexes.set(element, index);

        if (this._observationFrame !== null) {
            this._pendingObservations.add(element);
        } else {
            this._pendingObservations.delete(element);
            this._resizeObserver.observe(element, OBSERVE_OPTIONS);
        }
    }

    /** Detach an item element from index lookup and size observation. */
    _detach(element: HTMLElement) {
        this._elementIndexes.delete(element);
        this._pendingObservations.delete(element);
        this._resizeObserver.unobserve(element);
    }

    /**
     * Defer observations started by the current resize-driven publication.
     *
     * @remarks Promise microtasks still run within the same resize delivery, so
     * a frame boundary is required to avoid browser resize-loop errors.
     */
    _deferNewObservations() {
        if (this._observationFrame !== null) return;

        this._observationFrame = requestAnimationFrame(() => {
            this._observationFrame = null;

            for (const element of this._pendingObservations) {
                if (this._elementIndexes.has(element)) {
                    this._resizeObserver.observe(element, OBSERVE_OPTIONS);
                }
            }

            this._pendingObservations.clear();
        });
    }

    /** Cancel deferred work and disconnect every rendered item element. */
    _dispose() {
        if (this._observationFrame !== null) {
            cancelAnimationFrame(this._observationFrame);
        }
        this._observationFrame = null;
        this._pendingObservations.clear();
        this._resizeObserver.disconnect();
        this._elementIndexes = new WeakMap();
    }
}

export default ItemElements;
