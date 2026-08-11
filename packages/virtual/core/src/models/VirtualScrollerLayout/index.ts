import { VirtualScrollerEvent } from "../../constants";
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

    /** Create a DOM layout adapter for one model. */
    constructor(model: VirtualScroller) {
        this._model = model;
    }

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
        const fromOffset = this._model.getOffset(this._model.from);
        const toOffset = this._model.getOffset(this._model.to);
        const rangeSize = toOffset - fromOffset;
        const layoutOffset =
            this._model._shouldAnchorRangeEnd() &&
            this._model.to === this._model.itemCount
                ? Math.max(0.0, this._model.scrollSize - rangeSize)
                : fromOffset;

        return this._model.horizontal
            ? {
                  ...ITEMS_ELEMENT_STYLE,
                  display: "flex",
                  width: `${rangeSize}px`,
                  height: "100%",
                  transform: getItemsTransform(true, layoutOffset)
              }
            : {
                  ...ITEMS_ELEMENT_STYLE,
                  display: "block",
                  width: "100%",
                  height: `${rangeSize}px`,
                  transform: getItemsTransform(false, layoutOffset)
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
        if (element === this._scrollerElement) return;

        if (this._scrollerElement) this._model.setScroller(null);
        this._scrollerElement = element;

        if (element) {
            this._model.setScroller(element);
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
        this._unsubscribeSize ??= this._model.subscribe(() => {
            const element = this._sizeElement;
            if (element) {
                element.style[this._model.horizontal ? "width" : "height"] =
                    `${this._model.scrollSize}px`;
            }
        }, VirtualScrollerEvent.SCROLL_SIZE);
        this._unsubscribeItems ??= this._model.subscribe(
            () => {
                const element = this._itemsElement;
                if (element) {
                    const fromOffset = this._model.getOffset(this._model.from);
                    const toOffset = this._model.getOffset(this._model.to);
                    const rangeSize = toOffset - fromOffset;
                    const layoutOffset =
                        this._model._shouldAnchorRangeEnd() &&
                        this._model.to === this._model.itemCount
                            ? Math.max(0.0, this._model.scrollSize - rangeSize)
                            : fromOffset;
                    const horizontal = this._model.horizontal;

                    element.style.transform = getItemsTransform(
                        horizontal,
                        layoutOffset
                    );
                    element.style[horizontal ? "width" : "height"] =
                        `${rangeSize}px`;
                }
            },
            VirtualScrollerEvent.RANGE |
                VirtualScrollerEvent.SCROLL_SIZE |
                VirtualScrollerEvent.SIZES
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
        this._sizeElement = element;

        if (previous && previous !== element) {
            this._model.setContainer(null);
        }

        if (element) {
            this._connect();
            Object.assign(element.style, this.getSizeElementStyle());
            this._model.setContainer(element);
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
