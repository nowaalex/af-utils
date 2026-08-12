import type { AxisAdapter } from "../../../platform/axisAdapters";

/** Measure the rendered border box because it is the space occupied in layout. */
const OBSERVE_OPTIONS = {
    box: "border-box"
} as const satisfies ResizeObserverOptions;

const STICKY_HEADER_INDEX = 0;
const STICKY_FOOTER_INDEX = 1;

type StickyElementIndex =
    | typeof STICKY_HEADER_INDEX
    | typeof STICKY_FOOTER_INDEX;

interface InlineStyleValue {
    value: string;
    priority: string;
}

export type ResizeObserverFactory = (
    callback: ResizeObserverCallback
) => ResizeObserver;

/** Create a native resize observer for sticky elements. */
const createResizeObserver: ResizeObserverFactory = callback =>
    new ResizeObserver(callback);

/**
 * Owns sticky DOM elements, their observer, and their measured axis sizes.
 * Positioning remains native so sticky motion stays synchronized with the
 * browser's compositor scroll.
 */
class StickyElements {
    private _axisAdapter: AxisAdapter;
    private _onSizeChange: (relativeOffset: number) => void;
    // Stryker disable next-line ArrayDeclaration: the fixed tuple shape is checked by jit:check rather than behavioral tests.
    private _elements: [Element | null, Element | null] = [null, null];
    private _sizes: [number, number] = [0.0, 0.0];
    private readonly _resizeObserver: ResizeObserver;
    private _inlineZIndexes: [
        InlineStyleValue | null,
        InlineStyleValue | null
    ] = [null, null];

    /** Create sticky-element state for one scroll axis. */
    constructor(
        axisAdapter: AxisAdapter,
        onSizeChange: (relativeOffset: number) => void,
        resizeObserverFactory: ResizeObserverFactory = createResizeObserver
    ) {
        this._axisAdapter = axisAdapter;
        this._onSizeChange = onSizeChange;
        this._resizeObserver = resizeObserverFactory(entries => {
            this._applyResizeEntries(entries);
        });
    }

    /** Current sticky-header size on the scrolling axis. */
    get _headerSize() {
        return this._sizes[STICKY_HEADER_INDEX];
    }

    /** Current sticky-footer size on the scrolling axis. */
    get _footerSize() {
        return this._sizes[STICKY_FOOTER_INDEX];
    }

    /** Aggregate sticky size reserved from the viewport. */
    get _totalSize() {
        return this._headerSize + this._footerSize;
    }

    /** Attach or detach the sticky header. */
    _setHeader(element: HTMLElement | null) {
        this._set(STICKY_HEADER_INDEX, element);
    }

    /** Attach or detach the sticky footer. */
    _setFooter(element: HTMLElement | null) {
        this._set(STICKY_FOOTER_INDEX, element);
    }

    /** Disconnect every sticky element and observer resource. */
    _dispose() {
        this._set(STICKY_HEADER_INDEX, null);
        this._set(STICKY_FOOTER_INDEX, null);
        this._resizeObserver.disconnect();
    }

    /** Replace one sticky slot while preserving observer and style ownership. */
    private _set(index: StickyElementIndex, element: HTMLElement | null) {
        const oldElement = this._elements[index];

        if (oldElement) {
            this._restoreElement(index, oldElement as HTMLElement);
            this._resizeObserver.unobserve(oldElement);
            const oldSize = this._sizes[index];
            this._elements[index] = null;
            this._sizes[index] = 0.0;
            if (oldSize !== 0.0) {
                this._onSizeChange(-oldSize);
            }
        }

        if (element) {
            this._elements[index] = element;
            this._prepareElement(index, element);
            this._resizeObserver.observe(element, OBSERVE_OPTIONS);
        }
    }

    /** Apply sticky resize entries and publish their aggregate size delta. */
    private _applyResizeEntries(entries: readonly ResizeObserverEntry[]) {
        let relativeOffset = 0.0;

        for (const entry of entries) {
            const index = this._elements.indexOf(entry.target);
            if (index !== -1) {
                const nextSize = this._axisAdapter._readEntrySize(entry);
                relativeOffset += nextSize - this._sizes[index];
                this._sizes[index] = nextSize;
            }
        }

        if (relativeOffset !== 0.0) {
            this._onSizeChange(relativeOffset);
        }
    }

    /** Snapshot one inline CSS declaration for later restoration. */
    private _readInlineStyle(
        style: CSSStyleDeclaration,
        property: string
    ): InlineStyleValue {
        return {
            value: style.getPropertyValue(property),
            priority: style.getPropertyPriority(property)
        };
    }

    /** Restore one previously snapshotted inline CSS declaration. */
    private _restoreInlineStyle(
        style: CSSStyleDeclaration,
        property: string,
        original: InlineStyleValue
    ) {
        if (original.value) {
            style.setProperty(property, original.value, original.priority);
        } else {
            style.removeProperty(property);
        }
    }

    /** Add a fallback stacking level when native sticky styles need one. */
    private _prepareElement(index: StickyElementIndex, element: HTMLElement) {
        const view = element.ownerDocument?.defaultView;
        if (!view || !element.style) return;

        const computedStyle = view.getComputedStyle(element);
        if (
            computedStyle.position !== "sticky" ||
            (computedStyle.zIndex && computedStyle.zIndex !== "auto")
        ) {
            return;
        }

        this._inlineZIndexes[index] = this._readInlineStyle(
            element.style,
            "z-index"
        );
        element.style.setProperty("z-index", "1");
    }

    /** Restore inline styles owned while an element was attached. */
    private _restoreElement(index: StickyElementIndex, element: HTMLElement) {
        const original = this._inlineZIndexes[index];
        if (original && element.style) {
            this._restoreInlineStyle(element.style, "z-index", original);
        }

        this._inlineZIndexes[index] = null;
    }
}

export default StickyElements;
