import {
    VirtualScrollerEvent,
    type VirtualScrollerEventMask
} from "../../constants";
import {
    type AxisAdapter,
    horizontalAxisAdapter,
    verticalAxisAdapter
} from "../../platform/axisAdapters";
import {
    createScrollerAdapter,
    type ScrollerAdapter
} from "../../platform/scrollerAdapters";
import type {
    VirtualScrollerExactPosition,
    VirtualScrollerInitialParams,
    VirtualScrollerRuntimeParams,
    VirtualScrollerScrollElement
} from "../../types";
import SizeIndex from "../SizeIndex";
import VirtualScrollerEvents from "./events";
import ScrollActivity, { SCROLL_ENDED_IDLE_TIMEOUT_MS } from "./scrollActivity";
import StickyElements from "./stickyElements";

/** Measure the rendered border box because it is the space occupied in layout. */
const OBSERVE_OPTIONS = {
    box: "border-box"
} as const satisfies ResizeObserverOptions;

/** Default number of extra items rendered beyond each visible range edge. */
const DEFAULT_OVERSCAN_COUNT = 6;

/** Initial viewport estimate used until a scroller reports its real size. */
const DEFAULT_ESTIMATED_WIDGET_SIZE = 200.0;

/** Initial item estimate used until the caller or ResizeObserver replaces it. */
const DEFAULT_ESTIMATED_ITEM_SIZE = 40.0;

/**
 * Maximum CSS-pixel difference treated as the native scrollbar's end.
 * Fractional layout and device-pixel rounding can otherwise miss exact equality.
 */
const END_OFFSET_TOLERANCE = 1.0;

/** Delay used to coalesce potentially repeated items-container offset reads. */
const SCROLLER_OFFSET_UPDATE_DELAY_MS = 256;

/**
 * Failsafe duration for smooth scrolling when neither `scrollend` nor a final
 * scroll event arrives to release programmatic-scroll state.
 */
const SMOOTH_SCROLL_RELEASE_TIMEOUT_MS = 3_000;

/** Default number of corrections used while measured sizes converge. */
const DEFAULT_SCROLL_TO_INDEX_ATTEMPTS = 5;

/** Polling interval for smooth-scroll correction after the browser becomes idle. */
const SMOOTH_SCROLL_RETRY_INTERVAL_MS = 50;

/** One-frame approximation used for immediate scroll-to-index corrections. */
const INSTANT_SCROLL_RETRY_INTERVAL_MS = 16;

/**
 * @public
 *
 * Core framework-agnostic model.
 *
 * @remarks
 * What it does:
 *
 * - stores item sizes and positions;
 *
 * - tracks elements resizing;
 *
 * - provides performant way to calculate offsets;
 *
 * - deals with scrolling to item index or to offset;
 *
 * - emits and allows subscriptions to `VirtualScrollerEvent` flags.
 *
 *
 * What it doesn't do:
 *
 * - rendering;
 *
 * - styling;
 *
 * - all other framework-related stuff.
 */
class VirtualScroller {
    /** Revisioned synchronous event dispatcher for public model snapshots. */
    private _events: VirtualScrollerEvents;

    /** Monomorphic DOM accessors selected once for the configured axis. */
    private _axisAdapter: AxisAdapter = verticalAxisAdapter;

    /** DOM adapter for the currently attached scroll container. */
    private _scrollerAdapter: ScrollerAdapter | null = null;

    /** Native, pointer, and programmatic scroll lifecycle state. */
    private _scrollActivity: ScrollActivity;

    /**
     * Whether `_sizeIndex.totalSize` differs from the published `scrollSize`.
     * Publication is deferred while a native scrollbar interaction settles so
     * changing the track length cannot move the held thumb or blank the range.
     */
    private _hasDeferredScrollSize = false;

    /** Scroll correction to apply after the current event batch is published. */
    private _pendingScrollOffset: number | null = null;

    /** Retry interval used while `scrollToIndex` converges on measured sizes. */
    private _scrollToIndexTimer: ReturnType<typeof setInterval> | 0 = 0;

    /** Debounce timer for measuring the items-container offset. */
    private _scrollerOffsetTimer: ReturnType<typeof setTimeout> | 0 = 0;

    /** Native scroll position translated into items-container coordinates. */
    private _alignedScrollPos = 0.0;

    /** Distance from the scroll origin to the items size element. */
    private _scrollElementOffset = 0.0;

    /** {@inheritDoc VirtualScrollerRuntimeParams.itemCount} */
    private _itemCount = 0;

    /** Viewport size available to non-sticky virtual items. */
    private _availableWidgetSize = 0.0;

    /** {@inheritDoc VirtualScrollerRuntimeParams.overscanCount} */
    private _overscanCount = DEFAULT_OVERSCAN_COUNT;

    /** First element whose position defines `_scrollElementOffset`. */
    private _initialElement: HTMLElement | null = null;

    /** Item index associated with every currently observed element. */
    private _elementIndexes = new WeakMap<HTMLElement, number>();

    /** Prefix-size index containing estimates and measured item sizes. */
    private _sizeIndex = new SizeIndex(DEFAULT_ESTIMATED_ITEM_SIZE);

    /** @readonly {@inheritDoc VirtualScrollerInitialParams.horizontal} */
    horizontal = false;

    /** @readonly Current number of items in the model. */
    get itemCount() {
        return this._itemCount;
    }

    /** Native scrollbar offset corresponding to the end of an item-size value. */
    private _getNativeEndOffset(size: number) {
        return Math.max(
            0.0,
            this._scrollElementOffset +
                size -
                this._availableWidgetSize -
                this._sticky.headerSize
        );
    }

    /**
     * Whether layout must use the frozen public scroll size as its end anchor.
     * @internal Used only by framework-neutral layout adapters in this package.
     */
    _shouldAnchorRangeEnd() {
        const adapter = this._scrollerAdapter;
        return (
            this._hasDeferredScrollSize &&
            adapter !== null &&
            this._getNativeEndOffset(this.scrollSize) - adapter._readOffset() <=
                END_OFFSET_TOLERANCE
        );
    }

    /** Whether the native offset is at the end of the currently published size. */
    private _isAtPublishedEnd(adapter: ScrollerAdapter) {
        return (
            this._getNativeEndOffset(this.scrollSize) - adapter._readOffset() <=
            END_OFFSET_TOLERANCE
        );
    }

    /** Item-space offset of the viewport edge after a sticky header. */
    private _getVisibleStart() {
        return this._shouldAnchorRangeEnd()
            ? Math.max(
                  0.0,
                  this._sizeIndex.totalSize - this._availableWidgetSize
              )
            : this._alignedScrollPos + this._sticky.headerSize;
    }

    /**
     * @readonly
     * Sum of all item sizes */
    scrollSize = 0.0;

    /**
     * @readonly
     * Items range start with {@link VirtualScrollerRuntimeParams.overscanCount | overscanCount} included
     * @remarks
     * {@link VirtualScroller.from | from} \<= N \< {@link VirtualScroller.to | to}
     */
    from = 0;

    /**
     * @readonly
     * Items range end with {@link VirtualScrollerRuntimeParams.overscanCount | overscanCount} included
     * @remarks
     * {@link VirtualScroller.from | from} \<= N \< {@link VirtualScroller.to | to}
     */
    to = 0;

    /** Sticky DOM elements and their measured viewport reservations. */
    private _sticky: StickyElements;

    /** Observer that feeds rendered item sizes into `_sizeIndex`. */
    private _ElResizeObserver = new ResizeObserver(entries => {
        // TODO: Defer observing items mounted by a RANGE update until the next
        // animation frame. _applyMeasurements can synchronously publish RANGE,
        // causing an adapter to mount and observe new same-depth elements during
        // the current ResizeObserver delivery. The browser then skips their
        // notifications until the next frame and reports a resize-loop ErrorEvent.
        // Re-observing the same element (for example in React StrictMode) only
        // amplifies the issue; it is not the root cause.
        this._applyMeasurements(entries);
    });

    private _setScrollElementSize(size: number) {
        size -= this._sticky.totalSize;

        if (size !== this._availableWidgetSize) {
            this._availableWidgetSize = size;
            this.updateScrollerOffset();
            this._updateRangeFromEnd();
        }
    }

    private _updateStickyOffset(relativeOffset: number) {
        if (relativeOffset) {
            const adapter = this._scrollerAdapter;
            const wasAtEnd =
                !this._scrollActivity.pointerDragging &&
                adapter !== null &&
                this._isAtPublishedEnd(adapter);

            this._availableWidgetSize -= relativeOffset;

            if (wasAtEnd) {
                this._scheduleScrollCorrection(
                    this._getNativeEndOffset(this.scrollSize)
                );
            }
            this._updateRangeFromEnd();
        }
    }

    /** Disposer for the current scroller resize subscription. */
    private _unobserveResize = () => {
        // do nothing.
    };

    /** Disposer for the current native-scrollbar pointer subscription. */
    private _unobservePointerDrag = () => {
        // do nothing.
    };

    /** Stable callback passed to the scroller resize observer. */
    private _handleScrollerResize = (size: number) => {
        this._setScrollElementSize(size);
    };

    /** Stable callback receiving aggregate sticky-size changes. */
    private _handleStickySizeChange = (relativeOffset: number) => {
        this._updateStickyOffset(relativeOffset);
    };

    /** Publish model work held until the current scroll activity becomes idle. */
    private _handleScrollIdle = () => this._publishDeferredScrollSize();

    /** Apply batched scroll correction after layout subscribers. */
    private _handleEventBatchEnd = () => this._applyScrollCorrection();

    constructor(params?: VirtualScrollerInitialParams) {
        if (params) {
            this.horizontal = !!params.horizontal;
            this._axisAdapter = this.horizontal
                ? horizontalAxisAdapter
                : verticalAxisAdapter;
            // stickyOffset is included;
            this._scrollElementOffset =
                params.estimatedScrollElementOffset || 0.0;
            this._availableWidgetSize =
                params.estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE;
        }

        this._sticky = new StickyElements(
            this._axisAdapter,
            this._handleStickySizeChange
        );
        this._scrollActivity = new ScrollActivity(this._handleScrollIdle);
        this._events = new VirtualScrollerEvents(this._handleEventBatchEnd);

        if (params) this.set(params);
    }

    /**
     * Subscribe to model events
     * @returns unsubscribe function
     * @param callBack - event to be triggered
     * @param events - events to subscribe
     */
    subscribe(
        callBack: () => void,
        events: VirtualScrollerEventMask = VirtualScrollerEvent.ALL
    ) {
        return this._events.subscribe(callBack, events);
    }

    /** Return a stable external-store snapshot for the selected events. */
    getRevision(events: VirtualScrollerEventMask = VirtualScrollerEvent.ALL) {
        return this._events.getRevision(events);
    }

    private _publishScrollSize() {
        const nextScrollSize = this._sizeIndex.totalSize;

        if (nextScrollSize === this.scrollSize) {
            return;
        }

        this.scrollSize = nextScrollSize;
        this._events.emit(VirtualScrollerEvent.SCROLL_SIZE);
    }

    /** Keep the native scroll range stable until an active drag has settled. */
    private _publishOrDeferScrollSize() {
        if (
            this._scrollActivity.pointerDragging ||
            this._hasDeferredScrollSize
        ) {
            this._hasDeferredScrollSize =
                this._sizeIndex.totalSize !== this.scrollSize;
        } else {
            this._publishScrollSize();
        }
    }

    /** Apply and clear the latest batched native-scroll correction. */
    private _applyScrollCorrection = () => {
        const offset = this._pendingScrollOffset;
        this._pendingScrollOffset = null;

        if (offset !== null && this._scrollerAdapter) {
            this._scrollerAdapter._scrollTo(offset, "auto");
            this._syncScrollPosition();
        }
    };

    private _scheduleScrollCorrection(offset: number) {
        this._pendingScrollOffset = offset;
        if (!this._events.batching) this._applyScrollCorrection();
    }

    private _applyMeasurements(entries: readonly ResizeObserverEntry[]) {
        if (entries.length === 0) return;

        const from = this.from;
        const to = this.to;
        if (from >= to) return;

        const updateLimit = this._sizeIndex.getUpdateLimit(from, to);

        const adapter = this._scrollerAdapter;
        const canCorrectAnchor =
            adapter !== null && this._scrollActivity.anchorCorrectionAllowed;
        const exactFrom = canCorrectAnchor ? this._getExactFrom() : 0;

        let totalDiff = 0.0;
        let anchorDiff = 0.0;
        let changed = false;

        for (const entry of entries) {
            const index = this._elementIndexes.get(entry.target as HTMLElement);

            // ResizeObserver can deliver a final entry after an item left the rendered range.
            if (index === undefined || index < from || index >= to) continue;

            const diff = this._sizeIndex.updateSize(
                index,
                this._axisAdapter._readEntrySize(entry),
                updateLimit
            );
            if (diff !== 0.0) {
                changed = true;
                totalDiff += diff;
                if (index < exactFrom) anchorDiff += diff;
            }
        }

        if (!changed) return;

        this._sizeIndex.completeUpdateBatch(updateLimit, totalDiff);

        const deferScrollSize =
            this._scrollActivity.pointerDragging || this._hasDeferredScrollSize;
        const wasAtEnd =
            !deferScrollSize &&
            adapter !== null &&
            !this._scrollActivity.programmaticScrollActive &&
            this._isAtPublishedEnd(adapter);

        this._events.beginBatch();
        try {
            if (totalDiff !== 0.0) {
                if (deferScrollSize) {
                    this._publishOrDeferScrollSize();
                } else {
                    this._publishScrollSize();

                    if (wasAtEnd) {
                        this._scheduleScrollCorrection(
                            this._getNativeEndOffset(this.scrollSize)
                        );
                    } else if (
                        anchorDiff !== 0.0 &&
                        canCorrectAnchor &&
                        adapter
                    ) {
                        this._scheduleScrollCorrection(
                            adapter._readOffset() + anchorDiff
                        );
                    }
                }

                if (deferScrollSize || totalDiff < 0.0) {
                    this._updateRangeFromEnd();
                }
            }

            this._events.emit(VirtualScrollerEvent.SIZES);
        } finally {
            this._events.endBatch();
        }
    }

    /** Publish measurements accumulated while the native scrollbar was held. */
    private _publishDeferredScrollSize() {
        if (
            this._scrollActivity.pointerDragging ||
            !this._hasDeferredScrollSize
        )
            return;

        const adapter = this._scrollerAdapter;
        const wasAtEnd = adapter !== null && this._isAtPublishedEnd(adapter);

        this._hasDeferredScrollSize = false;
        this._events.beginBatch();
        try {
            this._publishScrollSize();
            if (wasAtEnd) {
                this._scheduleScrollCorrection(
                    this._getNativeEndOffset(this.scrollSize)
                );
            }
            this._updateRangeFromEnd();
        } finally {
            this._events.endBatch();
        }
    }

    /** Track native scrollbar ownership and publish its frozen range on release. */
    private _handlePointerDrag = (active: boolean) => {
        this._scrollActivity.setPointerDragging(active);

        if (!active) this._publishDeferredScrollSize();
    };

    /**
     * Get nearest item index for pixel offset;
     * @param offset - Pixel offset.
     * @returns Nearest item index
     *
     * @remarks
     * {@link VirtualScrollerRuntimeParams.itemCount | itemCount} must be \> 0.
     * Possible item index range: 0 \<= N \< {@link VirtualScrollerRuntimeParams.itemCount | itemCount}.
     * Time complexity: `O(log2(itemCount))`
     */
    getIndex(offset: number) {
        if (process.env.NODE_ENV !== "production") {
            if (!this._itemCount) {
                throw Error("getIndex must not be called when itemCount === 0");
            }
        }

        return this._sizeIndex.getIndex(offset);
    }

    /**
     * Get pixel offset by item index;
     * @param index - Item index. Must be \<= {@link VirtualScrollerRuntimeParams.itemCount | itemCount}
     * @returns Pixel offset
     *
     * @remarks
     * Possible offset range: 0 \<= N \<= {@link VirtualScroller.scrollSize | scrollSize}.
     * Time complexity: `O(log2(itemCount))`
     */
    getOffset(index: number) {
        if (process.env.NODE_ENV !== "production") {
            // fTree[0] is always empty, so minimum length of fTree equals itemCount+1
            if (index > this._itemCount) {
                throw Error(`index must not be > itemCount. Got: ${index}`);
            }
        }

        return this._sizeIndex.getOffset(index);
    }

    /**
     * Get last cached item size by item index
     * @param itemIndex - item index;
     * @returns last cached item size
     *
     * @remarks
     * Time complexity: `O(1)`
     */
    getSize(itemIndex: number) {
        if (process.env.NODE_ENV !== "production") {
            if (itemIndex < 0 || itemIndex >= this._itemCount) {
                throw Error("itemIndex must be < itemCount in getSize");
            }
        }
        return this._sizeIndex.getSize(itemIndex);
    }

    /**
     * Returns snapshot of current scroll position.
     *
     * @remarks
     * {@link VirtualScrollerExactPosition}
     *
     * @privateRemarks
     * "returns" tag is missed by api-extractor for getters (for now).
     * So using Regular description + type link.
     */
    get visibleFrom(): VirtualScrollerExactPosition {
        const firstVisibleIndex = this._getExactFrom();
        const visibleScrollPos = this._getVisibleStart();
        return (
            firstVisibleIndex +
            (visibleScrollPos - this.getOffset(firstVisibleIndex)) /
                this._sizeIndex.getSize(firstVisibleIndex)
        );
    }

    /**
     * Synchronize current scroll position with visible range
     */
    private _syncScrollPosition() {
        /*
            scrollElement may not be null here.
        */
        const newAlignedScrollPos =
            this._scrollerAdapter!._readOffset() - this._scrollElementOffset;

        if (newAlignedScrollPos > this._alignedScrollPos) {
            this._alignedScrollPos = newAlignedScrollPos;
            this._updateRangeFromEnd();
        } else if (newAlignedScrollPos < this._alignedScrollPos) {
            this._alignedScrollPos = newAlignedScrollPos;
            this._updateRangeFromStart();
        }
    }

    /** Synchronize the range and record the latest native scroll activity. */
    private _handleScrollEvent = () => {
        this._scrollActivity.onNativeScroll();
        this._syncScrollPosition();
    };

    /** Finish native scroll activity at the platform's definitive boundary. */
    private _handleScrollEnd = () => this._scrollActivity.onNativeScrollEnd();

    /**
     * Informs model about scrollable element.
     * @param element - scroller element
     *
     * @remarks
     * Must be called with `null` before killing the instance.
     */
    setScroller(element: VirtualScrollerScrollElement | null) {
        if (this._scrollerAdapter) {
            clearInterval(this._scrollToIndexTimer);
            this._scrollToIndexTimer = 0;
            this._scrollActivity.setIndexConverging(false);
            clearTimeout(this._scrollerOffsetTimer);
            this._unobserveResize();
            this._unobservePointerDrag();
            this._scrollActivity.reset();
            this._scrollerAdapter._removeScrollListener(
                this._handleScrollEvent
            );
            this._scrollerAdapter._removeScrollEndListener(
                this._handleScrollEnd
            );
        }

        this._scrollerAdapter = null;

        if (element) {
            const adapter = createScrollerAdapter(element, this._axisAdapter);

            this._scrollerAdapter = adapter;
            this._scrollActivity.setNativeScrollEndSupported(
                adapter._supportsScrollEnd()
            );
            this._unobserveResize = adapter._observeResize(
                this._handleScrollerResize
            );
            this._unobservePointerDrag = adapter._observePointerDrag(
                this._handlePointerDrag
            );
            adapter._addScrollListener(this._handleScrollEvent);
            adapter._addScrollEndListener(this._handleScrollEnd);
            this.updateScrollerOffset();
            this._syncScrollPosition();
        }
    }

    /**
     * Informs model about items container element. Usually not needed.
     *
     * @param element - container element
     *
     * @remarks
     * By default top/left offset between scroll container and first scrollable item is `0`.
     * In this case just {@link VirtualScroller.setScroller} is needed.
     * But extra element is needed when something "foreign" stands between scroll container and first scrollable item to measure distance between them.
     * That extra element is represented as `ItemsContainer` on this schema:
     *
     * ```plaintext
     * <ScrollContainer>                |.|
     *      Some header                 |s|
     *      Another header              |c|
     *      <ItemsContainer>            |r|
     *         item 1                   [o]
     *         item 2                   [l]
     *         item 3                   [l]
     *         ...                      [b]
     *      </ItemsContainer>           |a|
     *      Some footer                 |r|
     * </ScrollContainer>               |.|
     * ```
     *
     * Must be called with `null` before killing the instance.
     */
    setContainer(element: HTMLElement | null) {
        if (element !== this._initialElement) {
            this._initialElement = element;
            this.updateScrollerOffset();
        }
    }

    /**
     * Recalculates the offset between
     * {@link VirtualScroller.setScroller | scroller element} and {@link VirtualScroller.setContainer | container element}.
     *
     * @remarks
     * By default debounced by `SCROLLER_OFFSET_UPDATE_DELAY_MS` (`256`
     * milliseconds) and called automatically when:
     *
     * - {@link VirtualScroller.setScroller | setScroller} was called;
     *
     * - {@link VirtualScroller.setContainer | setContainer} was called;
     *
     * - {@link VirtualScroller.setScroller | scroller element} was resized.
     *
     * Normally this is enough, needed only if something else would trigger this offset change.
     */
    updateScrollerOffset() {
        clearTimeout(this._scrollerOffsetTimer);
        this._scrollerOffsetTimer = setTimeout(() => {
            const adapter = this._scrollerAdapter;
            if (adapter) {
                const newScrollElementOffset = adapter._distanceTo(
                    this._initialElement
                );

                const diff = newScrollElementOffset - this._scrollElementOffset;

                if (diff) {
                    const wasAtEnd =
                        !this._scrollActivity.pointerDragging &&
                        this._isAtPublishedEnd(adapter);

                    this._scrollElementOffset = newScrollElementOffset;
                    if (wasAtEnd) {
                        this._scheduleScrollCorrection(
                            this._getNativeEndOffset(this.scrollSize)
                        );
                    } else {
                        this._syncScrollPosition();
                    }
                }
            }
        }, SCROLLER_OFFSET_UPDATE_DELAY_MS);
    }

    /**
     * Start observing size of `element` at `index`
     * @param index - item index
     * @param element - element for item
     *
     * @remarks
     * Should be called when element gets mounted. Works in pair with {@link VirtualScroller.detachItem}.
     */
    attachItem(element: HTMLElement, index: number) {
        this._elementIndexes.set(element, index);
        this._ElResizeObserver.observe(element, OBSERVE_OPTIONS);
    }

    /**
     * End observing size of `element`
     * @param element - element for item
     *
     * @remarks
     * Should be called when element is about to unmount or already unmounted. Works in pair with {@link VirtualScroller.attachItem}.
     */
    detachItem(element: HTMLElement) {
        this._elementIndexes.delete(element);
        this._ElResizeObserver.unobserve(element);
    }

    /**
     * Start observing size of sticky header `element`. Observing is finished if element is `null`.
     * @param element - header element
     *
     * @remarks
     * Positioning remains native CSS `sticky`, keeping motion synchronized with
     * compositor scrolling. If its computed `z-index` is `auto`, the model adds
     * a default stacking level and restores the original inline value when the
     * element is replaced or cleared.
     *
     * Must be called with `null` before killing the instance.
     */
    setStickyHeader(element: HTMLElement | null) {
        this._sticky.setHeader(element);
    }

    /**
     * Start observing size of sticky footer `element`. Observing is finished if element is `null`.
     * @param element - footer element
     *
     * @remarks
     * Positioning remains native CSS `sticky`, keeping motion synchronized with
     * compositor scrolling. If its computed `z-index` is `auto`, the model adds
     * a default stacking level and restores the original inline value when the
     * element is replaced or cleared.
     *
     * Must be called with `null` before killing the instance.
     */
    setStickyFooter(element: HTMLElement | null) {
        this._sticky.setFooter(element);
    }

    /**
     * Get first visible item index (without overscan)
     * @returns first visible item index
     */
    private _getExactFrom() {
        return this._itemCount && this.getIndex(this._getVisibleStart());
    }

    /**
     * Get last visible item index (without overscan)
     * @returns last visible item index
     */
    private _getExactTo() {
        if (this._shouldAnchorRangeEnd()) {
            return this._itemCount;
        }

        return (
            this._itemCount &&
            1 +
                this.getIndex(
                    this._getVisibleStart() + this._availableWidgetSize
                )
        );
    }

    /**
     * Used to update current visible items range when scrolling down/right;
     * adds overscan reserve forward to reduce rerenders quantity
     */
    private _updateRangeFromEnd() {
        const exactTo = this._getExactTo();

        if (exactTo > this.to) {
            this.to = Math.min(this._itemCount, exactTo + this._overscanCount);
            this.from = this._getExactFrom();
            this._events.emit(VirtualScrollerEvent.RANGE);
        } else if (exactTo === this._itemCount && this.to === this._itemCount) {
            const exactFrom = this._getExactFrom();
            if (exactFrom !== this.from) {
                this.from = exactFrom;
                this._events.emit(VirtualScrollerEvent.RANGE);
            }
        }
    }

    /**
     * Used to update current visible items range when scrolling up/left;
     * adds overscan reserve backward to reduce rerenders quantity
     */
    private _updateRangeFromStart() {
        const exactFrom = this._getExactFrom();

        if (exactFrom < this.from) {
            this.from = Math.max(0, exactFrom - this._overscanCount);
            this.to = this._getExactTo();
            this._events.emit(VirtualScrollerEvent.RANGE);
        }
    }

    /**
     * Scroll to pixel offset
     *
     * @param offset - offset to scroll to
     * @param smooth - should smooth scroll be used
     */
    scrollToOffset(offset: number, smooth?: boolean) {
        const maxOffset = this._getNativeEndOffset(this._sizeIndex.totalSize);
        const targetOffset = Math.max(
            0.0,
            Math.min(maxOffset, this._scrollElementOffset + offset)
        );

        if (this._scrollerAdapter) {
            this._scrollActivity.startProgrammaticScroll(
                smooth
                    ? SMOOTH_SCROLL_RELEASE_TIMEOUT_MS
                    : SCROLL_ENDED_IDLE_TIMEOUT_MS
            );
            this._scrollerAdapter._scrollTo(
                targetOffset,
                smooth ? "smooth" : "auto"
            );
        }
    }

    /**
     * Scroll to item index
     *
     * @param index - item index to scroll to
     * @param smooth - should smooth scroll be used
     * @param attempts - quantity of scroll attempts to be done to ensure scroll offset is correct. Defaults to `5`
     *
     * @remarks
     * Calls {@link VirtualScroller.scrollToOffset | scrollToOffset} with calcuated offset until desired scroll position is reached.
     */
    scrollToIndex(
        index: VirtualScrollerExactPosition,
        smooth?: boolean,
        attempts = DEFAULT_SCROLL_TO_INDEX_ATTEMPTS
    ) {
        if (index < 0 || index >= this._itemCount) {
            throw new RangeError(
                `index must be >= 0 and < itemCount. Got: ${index}`
            );
        }
        if (!Number.isSafeInteger(attempts) || attempts < 1) {
            throw new RangeError(
                `attempts must be a positive integer. Got: ${attempts}`
            );
        }

        clearInterval(this._scrollToIndexTimer);
        this._scrollToIndexTimer = 0;
        this._scrollActivity.setIndexConverging(true);
        const wholeIndex = Math.trunc(index);

        this._scrollToIndexTimer = setInterval(
            () => {
                // checking if last scroll is finished
                if (
                    !smooth ||
                    this._scrollActivity.hasBeenIdleFor(
                        SCROLL_ENDED_IDLE_TIMEOUT_MS
                    )
                ) {
                    if (!--attempts) {
                        clearInterval(this._scrollToIndexTimer);
                        this._scrollToIndexTimer = 0;
                        this._scrollActivity.setIndexConverging(false);
                    }

                    this.scrollToOffset(
                        this.getOffset(wholeIndex) +
                            this._sizeIndex.getSize(wholeIndex) *
                                (index - wholeIndex) -
                            this._sticky.headerSize,
                        smooth
                    );
                }
            },
            smooth
                ? SMOOTH_SCROLL_RETRY_INTERVAL_MS
                : INSTANT_SCROLL_RETRY_INTERVAL_MS
        );
    }

    /**
     * Notify model about items quantity change
     * @param itemCount - new items quantity. {@link VirtualScrollerRuntimeParams.itemCount}
     */
    setItemCount(itemCount: number) {
        if (this._itemCount !== itemCount) {
            this._sizeIndex.setCount(itemCount);
            this._events.beginBatch();

            try {
                this._itemCount = itemCount;
                this._publishOrDeferScrollSize();

                if (this.to > itemCount) {
                    // after this range would be 100% updated
                    this.to = -1;
                }

                this._updateRangeFromEnd();
            } finally {
                this._events.endBatch();
            }
        }
    }

    /**
     * Synchronize runtime parameters
     * @param runtimeParams - runtime parameters
     */
    set(runtimeParams: VirtualScrollerRuntimeParams) {
        this._events.beginBatch();

        try {
            if (
                runtimeParams.estimatedItemSize !== undefined &&
                this._sizeIndex.setEstimatedSize(
                    runtimeParams.estimatedItemSize
                )
            ) {
                this._publishOrDeferScrollSize();
                this.to = -1;
                this._updateRangeFromEnd();
            }

            if (runtimeParams.overscanCount !== undefined) {
                if (
                    !Number.isSafeInteger(runtimeParams.overscanCount) ||
                    runtimeParams.overscanCount < 0
                ) {
                    throw new RangeError(
                        `overscanCount must be a non-negative integer. Got: ${runtimeParams.overscanCount}`
                    );
                }

                this._overscanCount = runtimeParams.overscanCount;
            }

            this.setItemCount(runtimeParams.itemCount ?? this._itemCount);
        } finally {
            this._events.endBatch();
        }
    }
}

export default VirtualScroller;
