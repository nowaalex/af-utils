import {
    VirtualScrollerEvent,
    type VirtualScrollerEventMask
} from "../../constants";
import { assert } from "#virtual-errors";
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
import SizeIndex, {
    assertEstimatedSize,
    assertSizeIndexCount
} from "../SizeIndex";
import { VirtualScrollerErrorIndex } from "../../errors/codes";
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

/** Validate the initial viewport-size estimate. */
const assertEstimatedWidgetSize = (size: number) => {
    assert(
        Number.isFinite(size) && size >= 0,
        VirtualScrollerErrorIndex.INVALID_WIDGET_SIZE,
        size
    );
};

/** Validate the initial items-container offset estimate. */
const assertEstimatedScrollerOffset = (offset: number) => {
    assert(
        Number.isFinite(offset),
        VirtualScrollerErrorIndex.INVALID_SCROLLER_OFFSET,
        offset
    );
};

/** Validate an overscan item count. */
const assertOverscanCount = (count: number) => {
    assert(
        Number.isSafeInteger(count) && count >= 0,
        VirtualScrollerErrorIndex.INVALID_OVERSCAN,
        count
    );
};

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
    // TODO: Split geometry/state transitions, DOM ownership, and effect
    // execution into separate components once the current lifecycle and cache
    // mutation contracts have stabilized.
    /** Revisioned synchronous event dispatcher for public model snapshots. */
    private _events: VirtualScrollerEvents;

    /** Monomorphic DOM accessors selected once for the configured axis. */
    private _axisAdapter: AxisAdapter = verticalAxisAdapter;

    /** DOM adapter for the currently attached scroll container. */
    private _scrollerAdapter: ScrollerAdapter | null = null;

    /** Native and programmatic scroll lifecycle state. */
    private _scrollActivity: ScrollActivity;

    /** Whether the internal total differs from the frozen public scroll size. */
    private _hasDeferredScrollSize = false;

    /** Whether a primary pointer remains pressed inside the current scroller. */
    private _pointerActive = false;

    /** Event target that owns the current pointer-start listener. */
    private _pointerElement: VirtualScrollerScrollElement | null = null;

    /** Scroll correction to apply after the current event batch is published. */
    private _pendingScrollOffset = 0.0;

    /** Whether `_pendingScrollOffset` contains a correction to apply. */
    private _hasPendingScrollOffset = false;

    /** Whether the pending correction must use the final published end offset. */
    private _pendingScrollToEnd = false;

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

    /** Whether new item observations must wait for a safe frame boundary. */
    private _deferItemObservations = false;

    /** Items mounted by subscribers during the current resize delivery. */
    private readonly _pendingItemObservations = new Set<HTMLElement>();

    /** Frame that starts item observations deferred from resize delivery. */
    private _itemObservationFrame: number | null = null;

    /** Whether terminal lifecycle cleanup has been requested. */
    private _disposed = false;

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
                this._sticky._headerSize
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
                  this._sizeIndex._totalSizeValue - this._availableWidgetSize
              )
            : this._alignedScrollPos + this._sticky._headerSize;
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
    private readonly _itemResizeObserver = new ResizeObserver(entries => {
        this._applyMeasurements(entries);
    });

    /** Schedule observations that must start after the current resize delivery. */
    private _scheduleItemObservationFrame() {
        if (this._itemObservationFrame !== null) return;

        // TODO: Replace this local frame queue with a shared post-commit DOM
        // effect scheduler if framework adapters gain that lifecycle hook. The
        // required boundary is after the current ResizeObserver delivery;
        // Promise microtasks still run inside it and do not prevent loop errors.
        this._itemObservationFrame = requestAnimationFrame(() => {
            this._itemObservationFrame = null;
            this._deferItemObservations = false;

            if (!this._disposed) {
                for (const element of this._pendingItemObservations) {
                    if (this._elementIndexes.has(element)) {
                        this._itemResizeObserver.observe(
                            element,
                            OBSERVE_OPTIONS
                        );
                    }
                }
            }

            this._pendingItemObservations.clear();
        });
    }

    /** Queue an item observation until resize delivery has finished. */
    private _deferItemObservation(element: HTMLElement) {
        this._pendingItemObservations.add(element);
        this._scheduleItemObservationFrame();
    }

    /** Apply a viewport-size observation to range geometry. */
    private _setScrollElementSize(size: number) {
        if (this._disposed) return;
        size -= this._sticky._totalSize;

        if (size !== this._availableWidgetSize) {
            this._availableWidgetSize = size;
            this.updateScrollerOffset();
            this._updateRangeFromEnd();
        }
    }

    /** Apply the aggregate sticky-size difference to viewport geometry. */
    private _updateStickyOffset(relativeOffset: number) {
        if (this._disposed) return;
        if (relativeOffset) {
            const adapter = this._scrollerAdapter;
            const wasAtEnd =
                adapter !== null && this._isAtPublishedEnd(adapter);

            this._availableWidgetSize -= relativeOffset;

            if (wasAtEnd) {
                this._scheduleEndCorrection();
            }
            this._updateRangeFromEnd();
        }
    }

    /** Disposer for the current scroller resize subscription. */
    private _unobserveResize = () => {
        // do nothing.
    };

    /** Create a virtual-scroller model from optional initial geometry. */
    constructor(params?: VirtualScrollerInitialParams) {
        const estimatedWidgetSize =
            params?.estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE;
        const estimatedScrollElementOffset =
            params?.estimatedScrollElementOffset ?? 0.0;
        assertEstimatedWidgetSize(estimatedWidgetSize);
        assertEstimatedScrollerOffset(estimatedScrollElementOffset);

        this.horizontal = !!params?.horizontal;
        this._axisAdapter = this.horizontal
            ? horizontalAxisAdapter
            : verticalAxisAdapter;
        this._scrollElementOffset = estimatedScrollElementOffset;
        this._availableWidgetSize = estimatedWidgetSize;

        this._sticky = new StickyElements(this._axisAdapter, relativeOffset =>
            this._updateStickyOffset(relativeOffset)
        );
        this._scrollActivity = new ScrollActivity(() =>
            this._publishDeferredScrollSize()
        );
        this._events = new VirtualScrollerEvents(() =>
            this._applyScrollCorrection()
        );

        this.set(params ?? {});
    }

    /** Reject mutations after terminal disposal. */
    private _assertMutable() {
        assert(!this._disposed, VirtualScrollerErrorIndex.DISPOSED);
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
        this._assertMutable();
        return this._events._subscribe(callBack, events);
    }

    /** Return a stable external-store snapshot for the selected events. */
    getRevision(events: VirtualScrollerEventMask = VirtualScrollerEvent.ALL) {
        return this._events._getRevision(events);
    }

    /** Publish the current total item size when its public value changed. */
    private _publishScrollSize() {
        const nextScrollSize = this._sizeIndex._totalSizeValue;

        if (nextScrollSize === this.scrollSize) {
            return;
        }

        this.scrollSize = nextScrollSize;
        this._events._emit(VirtualScrollerEvent.SCROLL_SIZE);
    }

    /** Keep native geometry stable until the current scroll transaction ends. */
    private _publishOrDeferScrollSize() {
        if (
            this._pointerActive ||
            this._scrollActivity._nativeScrollActive ||
            this._hasDeferredScrollSize
        ) {
            this._hasDeferredScrollSize =
                this._sizeIndex._totalSizeValue !== this.scrollSize;
        } else {
            this._publishScrollSize();
        }
    }

    /** Apply and clear the pending native-scroll correction, if any. */
    private _applyScrollCorrection() {
        const scrollToEnd = this._pendingScrollToEnd;
        if (!scrollToEnd && !this._hasPendingScrollOffset) return;

        const offset = scrollToEnd
            ? this._getNativeEndOffset(this.scrollSize)
            : this._pendingScrollOffset;
        this._pendingScrollToEnd = false;
        this._hasPendingScrollOffset = false;
        this._pendingScrollOffset = 0.0;

        if (this._scrollerAdapter) {
            this._scrollerAdapter._scrollTo(offset, "auto");
            this._syncScrollPosition();
        }
    }

    /** Queue an explicit native-scroll offset for the end of the event batch. */
    private _scheduleScrollCorrection(offset: number) {
        this._pendingScrollToEnd = false;
        this._hasPendingScrollOffset = true;
        this._pendingScrollOffset = Math.max(0.0, offset);
        if (!this._events._batching) this._applyScrollCorrection();
    }

    /** Resolve an end correction against final geometry when the batch ends. */
    private _scheduleEndCorrection() {
        this._pendingScrollToEnd = true;
        this._hasPendingScrollOffset = false;
        this._pendingScrollOffset = 0.0;
        if (!this._events._batching) this._applyScrollCorrection();
    }

    /** Cache valid item measurements delivered for the current rendered range. */
    private _applyMeasurements(entries: readonly ResizeObserverEntry[]) {
        if (this._disposed) return;
        if (entries.length === 0) return;

        const from = this.from;
        const to = this.to;
        if (from >= to) return;

        const updateLimit = this._sizeIndex._getUpdateLimit(from, to);

        const adapter = this._scrollerAdapter;
        const canCorrectAnchor =
            adapter !== null && this._scrollActivity._anchorCorrectionAllowed;
        const exactFrom = canCorrectAnchor ? this._getExactFrom() : 0;

        let totalDiff = 0.0;
        let anchorDiff = 0.0;
        let changed = false;

        for (const entry of entries) {
            const index = this._elementIndexes.get(entry.target as HTMLElement);

            // ResizeObserver can deliver a final entry after an item left the rendered range.
            if (index === undefined || index < from || index >= to) continue;

            const diff = this._sizeIndex._updateSize(
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

        this._sizeIndex._completeUpdateBatch(updateLimit, totalDiff);

        // React can commit RANGE subscribers just after this callback returns,
        // while the browser is still in the same ResizeObserver delivery.
        this._deferItemObservations = true;
        this._scheduleItemObservationFrame();
        this._reconcileMeasurements(anchorDiff, totalDiff);
    }

    /** Publish a measurement batch and preserve the active scroll anchor. */
    private _reconcileMeasurements(anchorDiff: number, totalDiff: number) {
        const adapter = this._scrollerAdapter;
        const canCorrectAnchor =
            adapter !== null && this._scrollActivity._anchorCorrectionAllowed;
        const deferScrollSize =
            this._pointerActive ||
            this._scrollActivity._nativeScrollActive ||
            this._hasDeferredScrollSize;
        const wasAtEnd =
            !deferScrollSize &&
            adapter !== null &&
            !this._scrollActivity._programmaticScrollActive &&
            this._isAtPublishedEnd(adapter);

        this._events._beginBatch();
        try {
            if (totalDiff !== 0.0) {
                if (deferScrollSize) {
                    this._publishOrDeferScrollSize();
                } else {
                    this._publishScrollSize();

                    if (wasAtEnd) {
                        this._scheduleEndCorrection();
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

            this._events._emit(VirtualScrollerEvent.SIZES);
        } finally {
            this._events._endBatch();
        }
    }

    /**
     * Publish geometry accumulated during one native scroll transaction.
     * @param pointerEnded - Whether an explicit pointer boundary makes a later
     * `scrollend` unnecessary for publication.
     */
    private _publishDeferredScrollSize(pointerEnded = false) {
        if (
            this._pointerActive ||
            (!pointerEnded && this._scrollActivity._nativeScrollActive) ||
            !this._hasDeferredScrollSize
        )
            return;

        this._flushScrollerOffset();
        const adapter = this._scrollerAdapter;
        const wasAtEnd = adapter !== null && this._isAtPublishedEnd(adapter);

        this._hasDeferredScrollSize = false;
        this._events._beginBatch();
        try {
            this._publishScrollSize();
            if (wasAtEnd) {
                this._scheduleEndCorrection();
            }
            this._updateRangeFromEnd();
        } finally {
            this._events._endBatch();
        }
    }

    /** Read the items-container offset before publishing frozen geometry. */
    private _flushScrollerOffset() {
        clearTimeout(this._scrollerOffsetTimer);
        this._scrollerOffsetTimer = 0;

        const adapter = this._scrollerAdapter;
        if (!adapter) return false;

        const nextOffset = adapter._distanceTo(this._initialElement);
        if (
            !Number.isFinite(nextOffset) ||
            nextOffset === this._scrollElementOffset
        )
            return false;

        this._scrollElementOffset = nextOffset;
        return true;
    }

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
        assert(
            Number.isFinite(offset),
            VirtualScrollerErrorIndex.INVALID_OFFSET,
            offset
        );
        assert(this._itemCount > 0, VirtualScrollerErrorIndex.EMPTY_MODEL);

        return this._sizeIndex._getIndex(offset);
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
        assert(
            Number.isSafeInteger(index) &&
                index >= 0 &&
                index <= this._itemCount,
            VirtualScrollerErrorIndex.INVALID_INDEX,
            index,
            this._itemCount
        );

        return this._sizeIndex._getOffset(index);
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
        assert(
            Number.isSafeInteger(itemIndex) &&
                itemIndex >= 0 &&
                itemIndex < this._itemCount,
            VirtualScrollerErrorIndex.INVALID_INDEX,
            itemIndex,
            this._itemCount
        );
        return this._sizeIndex._getSize(itemIndex);
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
        if (this._itemCount === 0) return 0.0;

        const firstVisibleIndex = this._getExactFrom();
        const visibleScrollPos = this._getVisibleStart();
        const size = this._sizeIndex._getSize(firstVisibleIndex);
        if (size <= 0.0) return firstVisibleIndex;

        return (
            firstVisibleIndex +
            (visibleScrollPos - this.getOffset(firstVisibleIndex)) / size
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
        this._scrollActivity._onNativeScroll();
        this._syncScrollPosition();
    };

    /** Finish native scroll activity at the platform's definitive boundary. */
    private _handleScrollEnd = () => this._scrollActivity._onNativeScrollEnd();

    /** Mark primary-pointer interaction without classifying its exact target. */
    private _handlePointerStart = (event: Event) => {
        if ((event as PointerEvent).isPrimary) this._pointerActive = true;
    };

    /** Release pointer-held geometry once both pointer and scroll are idle. */
    private _handlePointerEnd = (event: Event) => {
        if (!(event as PointerEvent).isPrimary) return;
        this._pointerActive = false;
        this._publishDeferredScrollSize(true);
    };

    /**
     * Informs model about scrollable element.
     * @param element - scroller element
     *
     * @remarks
     * {@link VirtualScroller.dispose | dispose} disconnects it automatically.
     */
    setScroller(element: VirtualScrollerScrollElement | null) {
        if (element) this._assertMutable();

        if (this._scrollerAdapter) {
            clearInterval(this._scrollToIndexTimer);
            this._scrollToIndexTimer = 0;
            this._scrollActivity._setIndexConverging(false);
            clearTimeout(this._scrollerOffsetTimer);
            this._unobserveResize();
            this._pointerElement?.removeEventListener(
                "pointerdown",
                this._handlePointerStart
            );
            window.removeEventListener("pointerup", this._handlePointerEnd);
            window.removeEventListener("pointercancel", this._handlePointerEnd);
            this._pointerElement = null;
            this._pointerActive = false;
            this._scrollActivity._reset();
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
            this._scrollActivity._setNativeScrollEndSupported(
                adapter._supportsScrollEnd()
            );
            this._unobserveResize = adapter._observeResize(size =>
                this._setScrollElementSize(size)
            );
            this._pointerElement = element;
            element.addEventListener("pointerdown", this._handlePointerStart);
            window.addEventListener("pointerup", this._handlePointerEnd);
            window.addEventListener("pointercancel", this._handlePointerEnd);
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
     * {@link VirtualScroller.dispose | dispose} disconnects it automatically.
     */
    setContainer(element: HTMLElement | null) {
        if (element) this._assertMutable();
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
        this._assertMutable();
        clearTimeout(this._scrollerOffsetTimer);
        this._scrollerOffsetTimer = setTimeout(() => {
            this._scrollerOffsetTimer = 0;
            const adapter = this._scrollerAdapter;
            if (adapter) {
                const newScrollElementOffset = adapter._distanceTo(
                    this._initialElement
                );
                const diff = newScrollElementOffset - this._scrollElementOffset;

                if (diff) {
                    const wasAtEnd = this._isAtPublishedEnd(adapter);

                    this._scrollElementOffset = newScrollElementOffset;
                    if (wasAtEnd) {
                        this._scheduleEndCorrection();
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
        this._assertMutable();
        assert(
            Number.isSafeInteger(index) &&
                index >= 0 &&
                index < this._itemCount,
            VirtualScrollerErrorIndex.INVALID_INDEX,
            index,
            this._itemCount
        );
        this._elementIndexes.set(element, index);

        if (this._deferItemObservations) {
            this._deferItemObservation(element);
        } else {
            this._pendingItemObservations.delete(element);
            this._itemResizeObserver.observe(element, OBSERVE_OPTIONS);
        }
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
        this._pendingItemObservations.delete(element);
        this._itemResizeObserver.unobserve(element);
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
     * {@link VirtualScroller.dispose | dispose} disconnects it automatically.
     */
    setStickyHeader(element: HTMLElement | null) {
        if (element) this._assertMutable();
        this._sticky._setHeader(element);
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
     * {@link VirtualScroller.dispose | dispose} disconnects it automatically.
     */
    setStickyFooter(element: HTMLElement | null) {
        if (element) this._assertMutable();
        this._sticky._setFooter(element);
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
            this._events._emit(VirtualScrollerEvent.RANGE);
        } else if (exactTo === this._itemCount && this.to === this._itemCount) {
            const exactFrom = this._getExactFrom();
            if (exactFrom !== this.from) {
                this.from = exactFrom;
                this._events._emit(VirtualScrollerEvent.RANGE);
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
            this._events._emit(VirtualScrollerEvent.RANGE);
        }
    }

    /**
     * Scroll to pixel offset
     *
     * @param offset - offset to scroll to
     * @param smooth - should smooth scroll be used
     */
    scrollToOffset(offset: number, smooth?: boolean) {
        this._assertMutable();
        assert(
            Number.isFinite(offset),
            VirtualScrollerErrorIndex.INVALID_OFFSET,
            offset
        );
        const maxOffset = this._getNativeEndOffset(
            this._sizeIndex._totalSizeValue
        );
        const targetOffset = Math.max(
            0.0,
            Math.min(maxOffset, this._scrollElementOffset + offset)
        );

        if (this._scrollerAdapter) {
            this._scrollActivity._startProgrammaticScroll(
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
        this._assertMutable();
        assert(
            Number.isFinite(index) && index >= 0 && index < this._itemCount,
            VirtualScrollerErrorIndex.INVALID_INDEX,
            index,
            this._itemCount
        );
        assert(
            Number.isSafeInteger(attempts) && attempts >= 1,
            VirtualScrollerErrorIndex.INVALID_ATTEMPTS,
            attempts
        );

        clearInterval(this._scrollToIndexTimer);
        this._scrollToIndexTimer = 0;
        this._scrollActivity._setIndexConverging(true);
        const wholeIndex = Math.trunc(index);

        this._scrollToIndexTimer = setInterval(
            () => {
                // checking if last scroll is finished
                if (
                    !smooth ||
                    this._scrollActivity._hasBeenIdleFor(
                        SCROLL_ENDED_IDLE_TIMEOUT_MS
                    )
                ) {
                    if (!--attempts) {
                        clearInterval(this._scrollToIndexTimer);
                        this._scrollToIndexTimer = 0;
                        this._scrollActivity._setIndexConverging(false);
                    }

                    this.scrollToOffset(
                        this.getOffset(wholeIndex) +
                            this._sizeIndex._getSize(wholeIndex) *
                                (index - wholeIndex) -
                            this._sticky._headerSize,
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
        this._assertMutable();
        assertSizeIndexCount(itemCount);

        if (this._itemCount !== itemCount) {
            this._sizeIndex._setCount(itemCount);
            this._events._beginBatch();

            try {
                this._itemCount = itemCount;
                this._publishOrDeferScrollSize();

                if (this.to > itemCount) {
                    // after this range would be 100% updated
                    this.to = -1;
                }

                this._updateRangeFromEnd();
            } finally {
                this._events._endBatch();
            }
        }
    }

    /**
     * Reset an explicit range, or preserve it while replacing the estimate,
     * and publish the resulting geometry atomically.
     */
    private _resetCachedSizes(
        from: number,
        to: number,
        estimatedItemSize?: number
    ) {
        const adapter = this._scrollerAdapter;
        const canCorrectAnchor =
            adapter !== null && this._scrollActivity._anchorCorrectionAllowed;
        const exactFrom = canCorrectAnchor ? this._getExactFrom() : 0;
        const oldAnchorOffset = canCorrectAnchor
            ? this._sizeIndex._getOffset(exactFrom)
            : 0.0;
        const deferScrollSize =
            this._pointerActive ||
            this._scrollActivity._nativeScrollActive ||
            this._hasDeferredScrollSize;
        const wasAtEnd =
            !deferScrollSize &&
            adapter !== null &&
            !this._scrollActivity._programmaticScrollActive &&
            this._isAtPublishedEnd(adapter);
        const { changed, totalDelta } =
            estimatedItemSize === undefined
                ? this._sizeIndex._invalidateSizes(from, to)
                : this._sizeIndex._setEstimatedSize(
                      estimatedItemSize,
                      from,
                      to
                  );

        if (!changed) return;

        const anchorDiff = canCorrectAnchor
            ? this._sizeIndex._getOffset(exactFrom) - oldAnchorOffset
            : 0.0;
        this._events._beginBatch();

        try {
            if (totalDelta !== 0.0) {
                this._publishOrDeferScrollSize();
            }

            if (!deferScrollSize && adapter) {
                if (wasAtEnd && totalDelta !== 0.0) {
                    this._scheduleEndCorrection();
                } else if (anchorDiff !== 0.0) {
                    this._scheduleScrollCorrection(
                        adapter._readOffset() + anchorDiff
                    );
                }
            }

            this.to = -1;
            this._updateRangeFromEnd();
            this._events._emit(VirtualScrollerEvent.SIZES);
        } finally {
            this._events._endBatch();
        }
    }

    /** Reset cached sizes in a half-open item range to the current estimate. */
    invalidateItemSizes(from = 0, to = this._itemCount) {
        this._assertMutable();
        assert(
            Number.isSafeInteger(from) &&
                Number.isSafeInteger(to) &&
                from >= 0 &&
                from <= to &&
                to <= this._itemCount,
            VirtualScrollerErrorIndex.INVALID_RANGE,
            from,
            to,
            this._itemCount
        );

        if (from === to) return;
        this._resetCachedSizes(from, to);
    }

    /**
     * Apply an index-based data splice to the size cache.
     *
     * @remarks Retained cached sizes are shifted with their items, inserted
     * items use the current estimate, and scroll preservation remains explicit.
     * The operation has `O(allocated capacity)` complexity.
     */
    spliceItems(start: number, deleteCount: number, insertCount: number) {
        this._assertMutable();
        assert(
            Number.isSafeInteger(start) &&
                Number.isSafeInteger(deleteCount) &&
                Number.isSafeInteger(insertCount) &&
                start >= 0 &&
                start <= this._itemCount &&
                deleteCount >= 0 &&
                deleteCount <= this._itemCount - start &&
                insertCount >= 0,
            VirtualScrollerErrorIndex.INVALID_SPLICE,
            start,
            deleteCount,
            insertCount,
            this._itemCount
        );

        if (deleteCount === 0 && insertCount === 0) return;

        const nextItemCount = this._itemCount - deleteCount + insertCount;
        assertSizeIndexCount(nextItemCount);
        const { sizesChanged } = this._sizeIndex._splice(
            start,
            deleteCount,
            insertCount
        );
        this._events._beginBatch();

        try {
            this._itemCount = nextItemCount;
            this._publishOrDeferScrollSize();
            this.to = -1;
            this._updateRangeFromEnd();
            if (sizesChanged) {
                this._events._emit(VirtualScrollerEvent.SIZES);
            }
        } finally {
            this._events._endBatch();
        }
    }

    /**
     * Synchronize runtime parameters
     * @param runtimeParams - runtime parameters
     */
    set(runtimeParams: VirtualScrollerRuntimeParams) {
        this._assertMutable();

        const estimatedItemSize = runtimeParams.estimatedItemSize;
        const itemCount = runtimeParams.itemCount ?? this._itemCount;
        const overscanCount = runtimeParams.overscanCount;

        if (estimatedItemSize !== undefined) {
            assertEstimatedSize(estimatedItemSize);
        }
        assertSizeIndexCount(itemCount);
        if (overscanCount !== undefined) {
            assertOverscanCount(overscanCount);
        }

        this._events._beginBatch();

        try {
            // An isolated overscan update intentionally does not invalidate the
            // current range. The value is picked up by the next natural range
            // recalculation. Assign it first so a simultaneous size/count
            // change uses the new reserve.
            if (overscanCount !== undefined) {
                this._overscanCount = overscanCount;
            }

            if (estimatedItemSize !== undefined) {
                this._resetCachedSizes(this.from, this.to, estimatedItemSize);
            }

            this.setItemCount(itemCount);
        } finally {
            this._events._endBatch();
        }
    }

    /** Release every DOM resource and subscription owned by this model. */
    dispose() {
        if (this._disposed) return;

        this.setScroller(null);
        this._disposed = true;
        clearInterval(this._scrollToIndexTimer);
        clearTimeout(this._scrollerOffsetTimer);
        if (this._itemObservationFrame !== null) {
            cancelAnimationFrame(this._itemObservationFrame);
        }
        this._scrollToIndexTimer = 0;
        this._scrollerOffsetTimer = 0;
        this._itemObservationFrame = null;
        this._deferItemObservations = false;
        this._pendingItemObservations.clear();
        this._hasDeferredScrollSize = false;
        this._pointerActive = false;
        this._pointerElement = null;
        this._pendingScrollOffset = 0.0;
        this._hasPendingScrollOffset = false;
        this._pendingScrollToEnd = false;
        this._initialElement = null;
        this._itemResizeObserver.disconnect();
        this._elementIndexes = new WeakMap();
        this._sticky._dispose();
        this._events._dispose();
    }
}

export default VirtualScroller;
