import { VirtualScrollerEventFlag } from "../../constants";
import type VirtualScroller from "../VirtualScroller";

/** Inert layout styles for the element that contributes the native scroll size. */
const SIZE_ELEMENT_STYLE = {
    position: "relative",
    overflow: "hidden",
    overflowAnchor: "none",
    contain: "size layout style"
} as const;

/** Layout styles for the positioned container of the currently rendered range. */
const ITEMS_ELEMENT_STYLE = {
    position: "absolute",
    contain: "size layout style",
    top: "0px",
    left: "0px"
} as const;

/** Required interaction and containment styles for the native scroller. */
const SCROLLER_ELEMENT_STYLE = {
    overflow: "auto",
    contain: "strict"
} as const;

/** Keep range movement on one compositor-backed block for smooth scrolling. */
const getItemsTransform = (horizontal: boolean, offset: number) =>
    horizontal
        ? `translate3d(${offset}px, 0px, 0px)`
        : `translate3d(0px, ${offset}px, 0px)`;

interface ItemsGeometry {
    _offset: number;
    _size: number;
}

/**
 * @public
 * Framework-neutral DOM layout adapter for {@link VirtualScroller}.
 *
 * @remarks
 * It keeps the scroll-size element and rendered-items element synchronized
 * without scheduling framework renders. Framework adapters expose it through
 * their native ref, action, or controller primitives.
 */
class VirtualScrollerLayout {
    /** Model whose public layout snapshots are reflected into DOM styles. */
    private readonly _model: VirtualScroller;

    /** Element whose extent exposes the published native scroll size. */
    private _sizeElement: HTMLElement | null = null;

    /** Absolutely positioned element containing the rendered item range. */
    private _itemsElement: HTMLElement | null = null;

    /** Scroll container whose interaction is enabled after model attachment. */
    private _scrollerElement: HTMLElement | null = null;

    /** Disposer for the scroll-size style subscription. */
    private _unsubscribeSize: (() => void) | null = null;

    /** Disposer for range position and extent style updates. */
    private _unsubscribeItems: (() => void) | null = null;

    /** Reusable rendered-range geometry snapshot. */
    private readonly _itemsGeometry: ItemsGeometry = {
        _offset: 0.0,
        _size: 0.0
    };

    /** Create a DOM layout adapter for one model. */
    constructor(model: VirtualScroller) {
        this._model = model;
    }

    /** Read the current rendered-range size and layout offset without allocating. */
    private _readItemsGeometry() {
        const geometry = this._itemsGeometry;

        geometry._size = this._model.renderedRangeSize;
        geometry._offset = this._model.renderedRangeOffset;

        return geometry;
    }

    /** Apply the current native scroll extent to the attached size element. */
    private readonly _applySizeGeometry = () => {
        const element = this._sizeElement;
        if (element) {
            element.style[this._model.horizontal ? "width" : "height"] =
                `${this._model.scrollSize}px`;
        }
    };

    /** Apply the current rendered-range position and extent to its element. */
    private readonly _applyItemsGeometry = () => {
        const element = this._itemsElement;
        if (element) {
            const geometry = this._readItemsGeometry();
            const horizontal = this._model.horizontal;

            element.style.transform = getItemsTransform(
                horizontal,
                geometry._offset
            );
            element.style[horizontal ? "width" : "height"] =
                `${geometry._size}px`;
        }
    };

    /** Apply every layout declaration owned by core to the size element. */
    private _initializeSizeElement(element: HTMLElement) {
        Object.assign(element.style, SIZE_ELEMENT_STYLE);

        if (this._model.horizontal) {
            element.style.height = "100%";
        } else {
            element.style.width = "100%";
        }

        this._applySizeGeometry();
    }

    /** Apply every layout declaration owned by core to the items element. */
    private _initializeItemsElement(element: HTMLElement) {
        const geometry = this._readItemsGeometry();
        const horizontal = this._model.horizontal;

        Object.assign(element.style, ITEMS_ELEMENT_STYLE);
        element.style.display = horizontal ? "flex" : "block";
        element.style.width = horizontal ? `${geometry._size}px` : "100%";
        element.style.height = horizontal ? "100%" : `${geometry._size}px`;
        element.style.transform = getItemsTransform(
            horizontal,
            geometry._offset
        );
    }

    /** Attach or detach the scroll container and apply its required styles. */
    setScrollerElement(element: HTMLElement | null) {
        if (element) Object.assign(element.style, SCROLLER_ELEMENT_STYLE);

        if (element !== this._scrollerElement) {
            if (this._scrollerElement) this._model.setScroller(null);
            this._scrollerElement = element;

            if (element) this._model.setScroller(element);
        }
    }

    /** Ensure attached layout elements receive subsequent model geometry. */
    private _ensureModelSubscriptions() {
        this._unsubscribeSize ??= this._model.subscribe(
            this._applySizeGeometry,
            VirtualScrollerEventFlag.SCROLL_SIZE
        );
        this._unsubscribeItems ??= this._model.subscribe(
            this._applyItemsGeometry,
            VirtualScrollerEventFlag.RANGE |
                VirtualScrollerEventFlag.SCROLL_SIZE |
                VirtualScrollerEventFlag.SIZES
        );
    }

    /** Unsubscribe once no managed layout element remains attached. */
    private _disconnectIfUnused() {
        if (!this._sizeElement && !this._itemsElement) {
            this._unsubscribeSize?.();
            this._unsubscribeItems?.();
            this._unsubscribeSize = null;
            this._unsubscribeItems = null;
        }
    }

    /** Connect or disconnect the element that provides native scroll size. */
    setSizeElement(element: HTMLElement | null) {
        const previous = this._sizeElement;
        const changed = previous !== element;
        this._sizeElement = element;

        if (previous && changed) {
            this._model.setContainer(null);
        }

        if (element) {
            this._ensureModelSubscriptions();
            this._initializeSizeElement(element);
            if (changed) this._model.setContainer(element);
        } else {
            this._disconnectIfUnused();
        }
    }

    /** Connect or disconnect the element containing currently rendered items. */
    setItemsElement(element: HTMLElement | null) {
        this._itemsElement = element;

        if (element) {
            this._ensureModelSubscriptions();
            this._initializeItemsElement(element);
        } else {
            this._disconnectIfUnused();
        }
    }

    /** Disconnect every element and event listener owned by this adapter. */
    dispose() {
        this.setScrollerElement(null);
        this.setSizeElement(null);
        this.setItemsElement(null);
        this._unsubscribeSize?.();
        this._unsubscribeItems?.();
        this._unsubscribeSize = null;
        this._unsubscribeItems = null;
    }
}

export default VirtualScrollerLayout;
