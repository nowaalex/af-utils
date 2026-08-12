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

/** Keep range movement on one compositor-backed block for smooth scrolling. */
const getItemsTransform = (horizontal: boolean, offset: number) =>
    horizontal
        ? `translate3d(${offset}px, 0px, 0px)`
        : `translate3d(0px, ${offset}px, 0px)`;

/**
 * Serializable inline styles shared by server and client layout adapters.
 * @public
 */
export type VirtualScrollerLayoutStyle = Readonly<
    Record<string, string | number>
>;

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
 * without scheduling framework renders. React and Solid adapters can expose
 * this class through their native ref primitives.
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

    /** Stable subscriber that publishes the current native scroll extent. */
    private readonly _updateSize = () => {
        const element = this._sizeElement;
        if (element) {
            element.style[this._model.horizontal ? "width" : "height"] =
                `${this._model.scrollSize}px`;
        }
    };

    /** Stable subscriber that positions and sizes the rendered item range. */
    private readonly _updateItems = () => {
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

    /**
     * Return a hydration-safe style for the scroll container.
     *
     * @param interactiveStyle - Style to expose after the model owns the DOM
     * element. Before attachment, scrolling is disabled while every other
     * declaration is preserved.
     */
    getScrollerElementStyle(
        interactiveStyle: VirtualScrollerLayoutStyle
    ): VirtualScrollerLayoutStyle {
        if (this._scrollerElement) return interactiveStyle;

        const {
            overflow: _overflow,
            overflowX: _overflowX,
            overflowY: _overflowY,
            overflowBlock: _overflowBlock,
            overflowInline: _overflowInline,
            ...nonScrollingStyle
        } = interactiveStyle;

        return { ...nonScrollingStyle, overflow: "hidden" };
    }

    /**
     * Return the complete current style for the native scroll-size element.
     *
     * @remarks Framework adapters should serialize this snapshot during server
     * rendering. Applying the scroll geometry only from a client ref changes
     * the native scrollbar track during hydration and can invalidate a thumb
     * drag that started against the server-rendered page.
     */
    getSizeElementStyle(): VirtualScrollerLayoutStyle {
        return this._model.horizontal
            ? {
                  ...SIZE_ELEMENT_STYLE,
                  width: `${this._model.scrollSize}px`,
                  height: "100%"
              }
            : {
                  ...SIZE_ELEMENT_STYLE,
                  width: "100%",
                  height: `${this._model.scrollSize}px`
              };
    }

    /**
     * Return the complete current style for the rendered item range.
     *
     * @remarks The snapshot is DOM-independent, so it is safe to use for both
     * server markup and the first client render. Later model events are still
     * synchronized directly by this adapter without framework rerenders.
     */
    getItemsElementStyle(): VirtualScrollerLayoutStyle {
        const geometry = this._readItemsGeometry();

        return this._model.horizontal
            ? {
                  ...ITEMS_ELEMENT_STYLE,
                  display: "flex",
                  width: `${geometry._size}px`,
                  height: "100%",
                  transform: getItemsTransform(true, geometry._offset)
              }
            : {
                  ...ITEMS_ELEMENT_STYLE,
                  display: "block",
                  width: "100%",
                  height: `${geometry._size}px`,
                  transform: getItemsTransform(false, geometry._offset)
              };
    }

    /**
     * Attach or detach the scroll container and expose native scrolling only
     * after the model listeners are installed.
     */
    setScrollerElement(
        element: HTMLElement | null,
        interactiveStyle: VirtualScrollerLayoutStyle
    ) {
        if (element !== this._scrollerElement) {
            if (this._scrollerElement) this._model.setScroller(null);
            this._scrollerElement = element;

            if (element) this._model.setScroller(element);
        }

        if (element) {
            element.style.overflow = String(
                interactiveStyle.overflow ?? "auto"
            );

            for (const property of [
                "overflowX",
                "overflowY",
                "overflowBlock",
                "overflowInline"
            ] as const) {
                const value = interactiveStyle[property];
                if (value !== undefined) {
                    element.style[property] = String(value);
                }
            }
        }
    }

    /** Subscribe attached layout elements to model geometry changes. */
    private _connect() {
        this._unsubscribeSize ??= this._model.subscribe(
            this._updateSize,
            VirtualScrollerEventFlag.SCROLL_SIZE
        );
        this._unsubscribeItems ??= this._model.subscribe(
            this._updateItems,
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
            this._connect();
            Object.assign(element.style, this.getSizeElementStyle());
            if (changed) this._model.setContainer(element);
        } else {
            this._disconnectIfUnused();
        }
    }

    /** Connect or disconnect the element containing currently rendered items. */
    setItemsElement(element: HTMLElement | null) {
        this._itemsElement = element;

        if (element) {
            this._connect();
            Object.assign(element.style, this.getItemsElementStyle());
        } else {
            this._disconnectIfUnused();
        }
    }

    /** Disconnect every element and event listener owned by this adapter. */
    dispose() {
        this.setScrollerElement(null, {});
        this.setSizeElement(null);
        this.setItemsElement(null);
        this._unsubscribeSize?.();
        this._unsubscribeItems?.();
        this._unsubscribeSize = null;
        this._unsubscribeItems = null;
    }
}

export default VirtualScrollerLayout;
