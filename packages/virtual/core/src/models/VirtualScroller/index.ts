import { assert } from "#virtual-errors";
import {
    VirtualScrollerEventFlag,
    type VirtualScrollerEventMask
} from "../../constants";
import { VirtualScrollerErrorIndex } from "../../errors/codes";
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
import VirtualScrollerEvents from "./events";
import ItemElements from "./itemElements";
import ScrollActivity, { SCROLL_ENDED_IDLE_TIMEOUT_MS } from "./scrollActivity";
import StickyElements from "./stickyElements";

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

/** Maximum native-offset difference that does not require another scroll. */
const SCROLL_TARGET_TOLERANCE = 1.0;

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

/** Mutually exclusive native-scroll correction waiting for publication. */
const enum ScrollCorrection {
    /** No native-scroll correction is pending. */
    NONE = 0,
    /** Apply a captured native CSS-pixel offset. */
    OFFSET = 1,
    /** Resolve and apply the final published native end offset. */
    END = 2
}

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
    /** Revisioned synchronous event dispatcher for public model snapshots. */
    private readonly _events = new VirtualScrollerEvents(() =>
        this._applyScrollCorrection()
    );

    /** Monomorphic DOM accessors selected once for the configured axis. */
    private readonly _axisAdapter: AxisAdapter;

    /**
     * DOM adapter for the currently attached scroll container.
     *
     * @remarks The model exists before a React ref or another framework DOM
     * lifecycle attaches, and it remains usable for geometry and SSR after
     * detachment. Consequently absence is real lifecycle state rather than a
     * placeholder adapter behavior.
     */
    private _scrollerAdapter: ScrollerAdapter | null = null;

    /** Native and programmatic scroll lifecycle state. */
    private readonly _scrollActivity = new ScrollActivity(() =>
        this._publishDeferredScrollSize()
    );

    /** Whether a primary pointer remains pressed inside the current scroller. */
    private _pointerActive = false;

    /** Native scroll correction, in CSS pixels, applied after event publication. */
    private _pendingScrollOffset = 0.0;

    /** Mutually exclusive kind of native-scroll correction waiting to run. */
    private _pendingScrollCorrection: ScrollCorrection = ScrollCorrection.NONE;

    /** Retry interval used while `scrollToIndex` converges on measured sizes. */
    private _scrollToIndexTimer: ReturnType<typeof setInterval> | 0 = 0;

    /** Debounce timer for measuring the items-container offset. */
    private _scrollerOffsetTimer: ReturnType<typeof setTimeout> | 0 = 0;

    /** Native scroll position translated into item-space CSS pixels. */
    private _alignedScrollPos = 0.0;

    /** Distance from the native scroll origin to the items element, in CSS px. */
    private _scrollElementOffset = 0.0;

    /** {@inheritDoc VirtualScrollerRuntimeParams.itemCount} */
    private _itemCount = 0;

    /** Viewport extent available to non-sticky items, in CSS pixels. */
    private _availableWidgetSize = 0.0;

    /** {@inheritDoc VirtualScrollerRuntimeParams.overscanCount} */
    private _overscanCount = DEFAULT_OVERSCAN_COUNT;

    /** First element whose position defines `_scrollElementOffset`. */
    private _initialElement: HTMLElement | null = null;

    /** Rendered item elements and their resize-observation lifecycle. */
    private readonly _items = new ItemElements(entries =>
        this._applyMeasurements(entries)
    );

    /** Whether terminal lifecycle cleanup has been requested. */
    private _disposed = false;

    /** Prefix-size index containing estimates and measured item sizes. */
    private _sizeIndex = new SizeIndex(DEFAULT_ESTIMATED_ITEM_SIZE);

    /**
     * @readonly Current scroll container orientation; see
     * {@link VirtualScrollerInitialParams.horizontal}.
     *
     * @remarks
     * This value is exposed as a directly readable runtime field and is
     * therefore technically assignable. Consumers must treat it as read-only:
     * assigning it is unsupported and may break model invariants.
     */
    horizontal = false;

    /** @readonly Current number of items in the model. */
    get itemCount() {
        return this._itemCount;
    }

    /**
     * Whether measured item geometry differs from the size currently exposed
     * to the browser and subscribers.
     *
     * @remarks
     * This is derived rather than stored: `_sizeIndex` is the internal source
     * of truth, while {@link VirtualScroller.scrollSize | scrollSize} is the
     * last published extent. For example, if the published track is `4000px`
     * and a measurement grows the internal total to `4040px`, this getter is
     * `true` until `_publishScrollSize` exposes `4040px`.
     *
     * Derivation also handles a later measurement returning the total to
     * `4000px`; no separate flag has to be cleared or synchronized.
     */
    private get _hasDeferredScrollSize() {
        return this._sizeIndex._totalSizeValue !== this.scrollSize;
    }

    /**
     * Convert an item-space extent to its native end-scroll offset.
     *
     * @param size - Total item extent in CSS pixels.
     * @returns Native scroll offset in CSS pixels, clamped to `0`.
     *
     * @remarks
     * The calculation translates item-space geometry into native-scroller
     * coordinates:
     *
     * ```plaintext
     * native origin
     *     |-- items offset --|-- item extent: size ----------------|
     *                                      |-- usable viewport ----|
     *
     * end = items offset + size - usable viewport - sticky header
     * ```
     *
     * For example, `offset = 20px`, `size = 1000px`, usable viewport
     * `= 300px` and sticky header `= 40px` produce `680px`.
     */
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
     * Convert an item-space coordinate to its clamped native scroll target.
     *
     * @param offset - Distance from item `0` in CSS pixels.
     * @returns Native scroll coordinate inside the current internal extent.
     */
    private _getNativeScrollTarget(offset: number) {
        return Math.max(
            0.0,
            Math.min(
                this._getNativeEndOffset(this._sizeIndex._totalSizeValue),
                this._scrollElementOffset + offset
            )
        );
    }

    /**
     * Whether layout must align the rendered range with the frozen public end.
     *
     * @remarks
     * While measurements are deferred, internal item geometry can be longer
     * than the published native scrollbar track. Keeping the rendered range at
     * the published end prevents a temporary blank area:
     *
     * ```plaintext
     * published track  [----------------|] 1000px
     * internal items   [------------------|] 1040px
     * held viewport                    [==]
     * ```
     *
     * @internal Used to derive visible and rendered geometry while native
     * scroll size publication is deferred.
     */
    get _shouldAnchorRangeEnd() {
        return this._hasDeferredScrollSize && this._isAtPublishedEnd;
    }

    /**
     * Whether the attached scroller is at the published native end.
     *
     * @returns `false` without an attached scroller; otherwise whether the
     * remaining distance is at most `END_OFFSET_TOLERANCE` CSS pixels.
     *
     * @remarks For example, a `680px` end and `679.4px` native offset differ by
     * `0.6px`, so they are treated as the same end position.
     */
    private get _isAtPublishedEnd() {
        return (
            this._scrollerAdapter !== null &&
            this._getNativeEndOffset(this.scrollSize) -
                this._scrollerAdapter._readOffset() <=
                END_OFFSET_TOLERANCE
        );
    }

    /**
     * Return the first visible item-space coordinate in CSS pixels.
     *
     * @remarks
     * During normal scrolling this is the aligned native offset plus the sticky
     * header. A deferred measurement creates two temporary coordinate systems:
     *
     * ```plaintext
     * published track: [----------------|] 4000px  (browser sees this)
     * internal items:  [------------------|] 4040px  (range uses this)
     * ```
     *
     * Away from the published end, the native offset remains the only stable
     * anchor, so the normal formula is preserved. At the published end, the
     * user's intent is unambiguous: keep showing the list end. The equivalent
     * internal coordinate is `internal extent - usable viewport`.
     *
     * With a `200px` usable viewport, the normal published-end coordinate is
     * `3800px`; after the internal total grows to `4040px`, the anchored
     * visible start is `3840px` even though the scrollbar is still frozen.
     */
    private get _visibleStart() {
        if (this._shouldAnchorRangeEnd) {
            return Math.max(
                0.0,
                this._sizeIndex._totalSizeValue - this._availableWidgetSize
            );
        }

        return this._alignedScrollPos + this._sticky._headerSize;
    }

    /**
     * Whether publishing the internal item extent must wait for interaction.
     *
     * @remarks Publication is deferred only while a primary pointer is held or
     * native scrolling is active. Whether unpublished geometry already exists
     * is derived independently by `_hasDeferredScrollSize`:
     *
     * ```plaintext
     * public scrollbar track [----------------|] 1000px  (frozen)
     * internal item extent   [------------------|] 1040px
     *                                      publish on pointerup / scrollend
     * ```
     */
    private get _scrollSizePublicationDeferred() {
        return this._pointerActive || this._scrollActivity._nativeScrollActive;
    }

    /**
     * Whether measurement deltas may move the native scroll anchor.
     *
     * @remarks A correction requires an attached scroller and completely idle
     * native/programmatic activity. If items before the visible anchor grow by
     * `20px`, the native offset is advanced by the same `20px`:
     *
     * ```plaintext
     * before: [ items before anchor ][ visible item ]
     * after:  [ items before anchor + 20px ][ visible item ]
     *                                      scroll offset + 20px
     * ```
     */
    private get _canCorrectAnchor() {
        return (
            this._scrollerAdapter !== null &&
            this._scrollActivity._anchorCorrectionAllowed
        );
    }

    /**
     * Whether an immediate size publication must keep the viewport at the end.
     *
     * @remarks Deferred geometry has its own release correction, while an
     * active programmatic scroll owns its target. This getter covers only idle,
     * immediately published geometry measured at the current native end.
     */
    private get _shouldPreservePublishedEnd() {
        return (
            !this._scrollSizePublicationDeferred &&
            !this._scrollActivity._programmaticScrollActive &&
            this._isAtPublishedEnd
        );
    }

    /** @readonly Sum of all published item sizes, in CSS pixels. */
    scrollSize = 0.0;

    /**
     * @readonly
     * Items range start with {@link VirtualScrollerRuntimeParams.overscanCount | overscanCount} included
     *
     * @remarks
     * {@link VirtualScroller.from | from} \<= N \< {@link VirtualScroller.to | to}
     *
     * This value is exposed as a directly readable runtime field and is
     * therefore technically assignable. Consumers must treat it as read-only:
     * assigning it is unsupported and may break model invariants.
     */
    from = 0;

    /**
     * @readonly
     * Items range end with {@link VirtualScrollerRuntimeParams.overscanCount | overscanCount} included
     *
     * @remarks
     * {@link VirtualScroller.from | from} \<= N \< {@link VirtualScroller.to | to}
     *
     * This value is exposed as a directly readable runtime field and is
     * therefore technically assignable. Consumers must treat it as read-only:
     * assigning it is unsupported and may break model invariants.
     */
    to = 0;

    /** Sticky DOM elements and their measured viewport reservations. */
    private readonly _sticky: StickyElements;

    /**
     * Apply a measured viewport extent to range geometry.
     * @param size - Full border-box extent of the scroller in CSS pixels.
     */
    private _setScrollElementSize(size: number) {
        if (this._disposed) return;
        size -= this._sticky._totalSize;

        if (size !== this._availableWidgetSize) {
            this._availableWidgetSize = size;
            this.updateScrollerOffset();
            this._updateRangeFromEnd();
        }
    }

    /**
     * Apply a sticky-element size delta to usable viewport geometry.
     * @param relativeOffset - Aggregate sticky-size change in CSS pixels;
     * positive values reduce the space available to virtual items.
     */
    private _updateStickyOffset(relativeOffset: number) {
        if (this._disposed) return;
        if (relativeOffset) {
            const wasAtEnd = this._isAtPublishedEnd;

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

    /** Disposer for pointer interaction listeners on the current scroller. */
    private _unobservePointer = () => {
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
        events: VirtualScrollerEventMask = VirtualScrollerEventFlag.ALL
    ) {
        this._assertMutable();
        return this._events._subscribe(callBack, events);
    }

    /** Return a stable external-store snapshot for the selected events. */
    getRevision(
        events: VirtualScrollerEventMask = VirtualScrollerEventFlag.ALL
    ) {
        return this._events._getRevision(events);
    }

    /** Publish the current total item size when its public value changed. */
    private _publishScrollSize() {
        const nextScrollSize = this._sizeIndex._totalSizeValue;

        if (nextScrollSize === this.scrollSize) {
            return;
        }

        this.scrollSize = nextScrollSize;
        this._events._emit(VirtualScrollerEventFlag.SCROLL_SIZE);
    }

    /** Keep native geometry stable until the current scroll transaction ends. */
    private _publishOrDeferScrollSize() {
        if (!this._scrollSizePublicationDeferred) {
            this._publishScrollSize();
        }
    }

    /**
     * Publish structural collection geometry regardless of scroll activity.
     *
     * @remarks A collection change is real content growth rather than a
     * measurement correction. It therefore ends any measurement deferral and
     * keeps the current native offset instead of following the collection's
     * new end. A fixed anchor correction remains valid when an independent
     * estimate reset queued it earlier in the same outer batch.
     */
    private _publishCollectionScrollSize() {
        if (this._pendingScrollCorrection === ScrollCorrection.END) {
            this._pendingScrollCorrection = ScrollCorrection.NONE;
            this._pendingScrollOffset = 0.0;
        }
        this._publishScrollSize();
    }

    /** Apply and clear the pending native-scroll correction, if any. */
    private _applyScrollCorrection() {
        const correction = this._pendingScrollCorrection;
        if (correction === ScrollCorrection.NONE) return;

        const offset =
            correction === ScrollCorrection.END
                ? this._getNativeEndOffset(this.scrollSize)
                : this._pendingScrollOffset;
        this._pendingScrollCorrection = ScrollCorrection.NONE;
        this._pendingScrollOffset = 0.0;

        if (this._scrollerAdapter) {
            this._scrollerAdapter._scrollTo(offset, "auto");
            this._syncScrollPosition();
        }
    }

    /**
     * Queue a fixed native offset correction after the current event batch.
     *
     * @param offset - Native scroll coordinate in CSS pixels. Negative input
     * is clamped to `0px`.
     *
     * @remarks
     * The numeric target is captured immediately. This preserves a visible
     * item when measurements before it move by a known delta. For example, if
     * the browser is at `400px` and preceding items grow by `20px`, this queues
     * the fixed target `420px`:
     *
     * ```plaintext
     * before: 400px [ visible anchor ]
     * growth: +20px before the anchor
     * after:  420px [ same visible anchor ]
     * ```
     *
     * A later queued correction replaces the earlier one. Application waits
     * until the outer event batch has let subscribers update DOM geometry.
     */
    private _scheduleOffsetCorrection(offset: number) {
        this._pendingScrollCorrection = ScrollCorrection.OFFSET;
        this._pendingScrollOffset = Math.max(0.0, offset);
        if (!this._events._batching) this._applyScrollCorrection();
    }

    /**
     * Queue an end-preserving correction after the current event batch.
     *
     * @remarks
     * Unlike `_scheduleOffsetCorrection`, this stores the symbolic intent
     * “scroll to the published end”, not a CSS-pixel coordinate. The final
     * offset is resolved by `_applyScrollCorrection` only after subscribers
     * have applied the new {@link VirtualScroller.scrollSize | scrollSize}.
     *
     * For a `200px` viewport, growing the published extent from `4000px` to
     * `4040px` moves the end from `3800px` to `3840px`:
     *
     * ```plaintext
     * event batch: publish 4040px -> subscribers resize DOM -> scroll 3840px
     * ```
     *
     * Resolving the coordinate when scheduling would use stale geometry if a
     * later mutation in the same batch changed the total again. A later fixed
     * offset correction can replace this pending end intent.
     */
    private _scheduleEndCorrection() {
        this._pendingScrollCorrection = ScrollCorrection.END;
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

        const canCorrectAnchor = this._canCorrectAnchor;
        const exactFrom = canCorrectAnchor ? this._exactFrom : 0;

        let totalDiff = 0.0;
        let anchorDiff = 0.0;
        let changed = false;

        for (const entry of entries) {
            const index = this._items._getIndex(entry.target);

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
        this._items._deferNewObservations();
        this._reconcileMeasurements(anchorDiff, totalDiff);
    }

    /**
     * Publish one measurement batch while preserving its visible anchor.
     * @param anchorDiff - Size delta before the first visible item, in CSS px.
     * @param totalDiff - Size delta across the complete item set, in CSS px.
     */
    private _reconcileMeasurements(anchorDiff: number, totalDiff: number) {
        const shouldDeferScrollSize = this._scrollSizePublicationDeferred;
        // Capture this before publishing changes the end offset being tested.
        const shouldPreservePublishedEnd = this._shouldPreservePublishedEnd;

        this._events._beginBatch();
        try {
            if (totalDiff !== 0.0) {
                if (shouldDeferScrollSize) {
                    this._publishOrDeferScrollSize();
                } else {
                    this._publishScrollSize();

                    if (shouldPreservePublishedEnd) {
                        this._scheduleEndCorrection();
                    } else if (
                        anchorDiff !== 0.0 &&
                        this._canCorrectAnchor &&
                        this._scrollerAdapter
                    ) {
                        this._scheduleOffsetCorrection(
                            this._scrollerAdapter._readOffset() + anchorDiff
                        );
                    }
                }

                if (shouldDeferScrollSize || totalDiff < 0.0) {
                    this._updateRangeFromEnd();
                }
            }

            this._events._emit(VirtualScrollerEventFlag.SIZES);
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
            !this._hasDeferredScrollSize ||
            this._pointerActive ||
            (!pointerEnded && this._scrollActivity._nativeScrollActive)
        )
            return;

        this._flushScrollerOffset();
        const wasAtEnd = this._isAtPublishedEnd;

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

    /**
     * Read the items-container offset before publishing frozen geometry.
     * @returns Whether the stored native-to-item offset changed.
     *
     * @remarks Both the measured and stored offsets use CSS pixels. The
     * debounced measurement timer is cancelled so end correction uses the DOM
     * geometry from the same interaction boundary.
     */
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
     * Return the item containing an item-space coordinate.
     * @param offset - Coordinate from the start of item `0`, in CSS pixels.
     * @returns Item index in the range `0 <= index < itemCount`.
     *
     * @remarks
     * {@link VirtualScrollerRuntimeParams.itemCount | itemCount} must be \> 0.
     * With item sizes `[40px, 60px]`, `getIndex(55)` returns `1`:
     *
     * ```plaintext
     * 0px             40px                           100px
     * |---- item 0 ----|---------- item 1 ------------|
     *                               ^ 55px
     * ```
     *
     * Time complexity: `O(log2(itemCount))`.
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
     * Return the leading item-space coordinate of an item boundary.
     * @param index - Boundary index in `0 <= index <= itemCount`.
     * @returns Offset from item `0`, in CSS pixels.
     *
     * @remarks
     * `getOffset(0)` is always `0`; `getOffset(itemCount)` equals the current
     * internal total extent. With item sizes `[40px, 60px]`, `getOffset(1)` is
     * `40px` and `getOffset(2)` is `100px`.
     *
     * Time complexity: `O(log2(itemCount))`.
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
     * Return the current measured or estimated extent of one item.
     * @param itemIndex - Item index in `0 <= itemIndex < itemCount`.
     * @returns Cached item extent in CSS pixels.
     *
     * @remarks Unmeasured and invalidated items return the current estimate.
     * Time complexity: `O(1)`.
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
     * Return the current rendered range extent, including overscan.
     * @returns Size from {@link VirtualScroller.from | from} through the
     * exclusive {@link VirtualScroller.to | to} boundary, in CSS pixels.
     *
     * @remarks Time complexity: `O(log2(itemCount))`.
     */
    get renderedRangeSize() {
        return this.getOffset(this.to) - this.getOffset(this.from);
    }

    /**
     * Return the item-space layout offset of the current rendered range.
     * @returns Offset for positioning the range, in CSS pixels.
     *
     * @remarks
     * Normally this equals `getOffset(from)`. While size publication is
     * deferred at the native scroll end, the range is aligned with the frozen
     * public {@link VirtualScroller.scrollSize | scrollSize} so newly measured
     * geometry cannot leave a temporary blank area.
     *
     * Time complexity: `O(log2(itemCount))`.
     */
    get renderedRangeOffset() {
        const fromOffset = this.getOffset(this.from);

        if (this.to !== this._itemCount || !this._shouldAnchorRangeEnd) {
            return fromOffset;
        }

        return Math.max(
            0.0,
            this.scrollSize - (this.getOffset(this.to) - fromOffset)
        );
    }

    /**
     * Return the current scroll position as a fractional item index.
     *
     * @remarks
     * The integer part identifies the first visible item and the fractional
     * part describes progress through it. For example, `12.25` means that item
     * `12` is first and `25%` of its CSS-pixel extent is above the visible edge.
     * See {@link VirtualScrollerExactPosition}.
     *
     * @privateRemarks
     * "returns" tag is missed by api-extractor for getters (for now).
     * So using Regular description + type link.
     */
    get visibleFrom(): VirtualScrollerExactPosition {
        if (this._itemCount === 0) return 0.0;

        const firstVisibleIndex = this._exactFrom;
        const visibleScrollPos = this._visibleStart;
        const size = this._sizeIndex._getSize(firstVisibleIndex);
        if (size <= 0.0) return firstVisibleIndex;

        return (
            firstVisibleIndex +
            (visibleScrollPos - this.getOffset(firstVisibleIndex)) / size
        );
    }

    /**
     * Translate the native offset into item space and synchronize the range.
     *
     * @remarks All offsets use CSS pixels:
     *
     * ```plaintext
     * native scroll offset - items-container offset = aligned item position
     * ```
     *
     * Forward motion grows the range from its end; backward motion grows it
     * from its start so overscan is placed in the direction of travel.
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
     * See the [layout elements guide](/virtual/guides/layout-elements) for the
     * scroller's position in the required DOM structure.
     *
     * {@link VirtualScroller.dispose | dispose} disconnects it automatically.
     */
    setScroller(element: VirtualScrollerScrollElement | null) {
        if (element) this._assertMutable();
        if (element && this._scrollerAdapter?._matchesTarget(element)) return;

        if (this._scrollerAdapter) {
            clearInterval(this._scrollToIndexTimer);
            this._scrollToIndexTimer = 0;
            this._scrollActivity._setIndexConverging(false);
            clearTimeout(this._scrollerOffsetTimer);
            this._unobserveResize();
            this._unobservePointer();
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
            this._unobservePointer = adapter._observePointer(
                this._handlePointerStart,
                this._handlePointerEnd
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
     * See the [layout elements guide](/virtual/guides/layout-elements) for how
     * this measurement container relates to the scroller and rendered range.
     *
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
     * See the [layout elements guide](/virtual/guides/layout-elements) for the
     * geometry whose origin this method refreshes.
     *
     * By default debounced by `SCROLLER_OFFSET_UPDATE_DELAY_MS` (`256`
     * milliseconds) and called automatically when:
     *
     * - {@link VirtualScroller.setScroller | setScroller} was called;
     *
     * - {@link VirtualScroller.setContainer | setContainer} was called;
     *
     * - {@link VirtualScroller.setScroller | scroller element} was resized.
     *
     * The stored value is measured in CSS pixels along the configured axis:
     *
     * ```plaintext
     * native origin |---- items-container offset ----| item 0
     * ```
     *
     * Normally the automatic calls are enough. Call this method when external
     * DOM changes move the items container relative to the scroller.
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
                    const wasAtEnd = this._isAtPublishedEnd;

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
     * See the [layout elements guide](/virtual/guides/layout-elements) for where
     * mounted items belong.
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
        this._items._attach(element, index);
    }

    /**
     * End observing size of `element`
     * @param element - element for item
     *
     * @remarks
     * Should be called when element is about to unmount or already unmounted. Works in pair with {@link VirtualScroller.attachItem}.
     * See the [layout elements guide](/virtual/guides/layout-elements) for where
     * mounted items belong.
     */
    detachItem(element: HTMLElement) {
        this._items._detach(element);
    }

    /**
     * Start observing size of sticky header `element`. Observing is finished if element is `null`.
     * @param element - header element
     *
     * @remarks
     * See the [layout elements guide](/virtual/guides/layout-elements) for how
     * sticky siblings reserve space around the size element.
     *
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
     * See the [layout elements guide](/virtual/guides/layout-elements) for how
     * sticky siblings reserve space around the size element.
     *
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
     * Return the first visible item index, excluding overscan.
     * @returns Index containing the visible-start CSS-pixel coordinate.
     */
    private get _exactFrom() {
        return this._itemCount && this.getIndex(this._visibleStart);
    }

    /**
     * Return the exclusive visible-end item boundary, excluding overscan.
     * @returns One plus the index containing the visible-end coordinate, or
     * `itemCount` while the rendered end is anchored to frozen geometry.
     */
    private get _exactTo() {
        if (this._shouldAnchorRangeEnd) {
            return this._itemCount;
        }

        return (
            this._itemCount &&
            1 + this.getIndex(this._visibleStart + this._availableWidgetSize)
        );
    }

    /**
     * Used to update current visible items range when scrolling down/right;
     * adds overscan reserve forward to reduce rerenders quantity
     */
    private _updateRangeFromEnd() {
        const exactTo = this._exactTo;

        if (exactTo > this.to) {
            this.to = Math.min(this._itemCount, exactTo + this._overscanCount);
            this.from = this._exactFrom;
            this._events._emit(VirtualScrollerEventFlag.RANGE);
        } else if (exactTo === this._itemCount && this.to === this._itemCount) {
            const exactFrom = this._exactFrom;
            if (exactFrom !== this.from) {
                this.from = exactFrom;
                this._events._emit(VirtualScrollerEventFlag.RANGE);
            }
        }
    }

    /**
     * Used to update current visible items range when scrolling up/left;
     * adds overscan reserve backward to reduce rerenders quantity
     */
    private _updateRangeFromStart() {
        const exactFrom = this._exactFrom;

        if (exactFrom < this.from) {
            this.from = Math.max(0, exactFrom - this._overscanCount);
            this.to = this._exactTo;
            this._events._emit(VirtualScrollerEventFlag.RANGE);
        }
    }

    /**
     * Scroll to an item-space CSS-pixel coordinate.
     *
     * @param offset - Distance from the start of item `0`, in CSS pixels.
     * @param smooth - Whether to request native smooth scrolling.
     *
     * @remarks The items-container offset is added before dispatching the
     * native scroll, and the result is clamped to the current scrollable range:
     *
     * ```plaintext
     * native target = items-container offset + requested item-space offset
     * ```
     */
    scrollToOffset(offset: number, smooth?: boolean) {
        this._assertMutable();
        assert(
            Number.isFinite(offset),
            VirtualScrollerErrorIndex.INVALID_OFFSET,
            offset
        );
        const targetOffset = this._getNativeScrollTarget(offset);

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
     * Scroll to an integer or fractional item position.
     *
     * @param index - Exact item position; `12.5` targets the midpoint of item
     * `12` at the visible edge after accounting for the sticky header.
     * @param smooth - Whether to request native smooth scrolling.
     * @param attempts - Maximum corrections while measured sizes converge;
     * defaults to `5`.
     *
     * @remarks
     * Checks the target immediately and then while measurements converge,
     * calling {@link VirtualScroller.scrollToOffset | scrollToOffset} only when
     * rendering replaces estimated CSS-pixel sizes and moves the native target.
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

        /** Scroll only when measurement convergence moved the native target. */
        const scrollToCurrentTarget = () => {
            const offset =
                this.getOffset(wholeIndex) +
                this._sizeIndex._getSize(wholeIndex) * (index - wholeIndex) -
                this._sticky._headerSize;
            const adapter = this._scrollerAdapter;

            if (
                !adapter ||
                Math.abs(
                    adapter._readOffset() - this._getNativeScrollTarget(offset)
                ) > SCROLL_TARGET_TOLERANCE
            ) {
                this.scrollToOffset(offset, smooth);
            }
        };

        scrollToCurrentTarget();
        attempts--;

        if (attempts === 0) {
            this._scrollActivity._setIndexConverging(false);
            return;
        }

        this._scrollToIndexTimer = setInterval(
            () => {
                // checking if last scroll is finished
                if (
                    !smooth ||
                    this._scrollActivity._hasBeenIdleFor(
                        SCROLL_ENDED_IDLE_TIMEOUT_MS
                    )
                ) {
                    scrollToCurrentTarget();

                    if (!--attempts) {
                        clearInterval(this._scrollToIndexTimer);
                        this._scrollToIndexTimer = 0;
                        this._scrollActivity._setIndexConverging(false);
                    }
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
                this._publishCollectionScrollSize();

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
        const canCorrectAnchor = this._canCorrectAnchor;
        const exactFrom = canCorrectAnchor ? this._exactFrom : 0;
        const oldAnchorOffset = canCorrectAnchor
            ? this._sizeIndex._getOffset(exactFrom)
            : 0.0;
        const deferScrollSize = this._scrollSizePublicationDeferred;
        const wasAtEnd = this._shouldPreservePublishedEnd;
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
                    this._scheduleOffsetCorrection(
                        adapter._readOffset() + anchorDiff
                    );
                }
            }

            this.to = -1;
            this._updateRangeFromEnd();
            this._events._emit(VirtualScrollerEventFlag.SIZES);
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
            this._publishCollectionScrollSize();
            this.to = -1;
            this._updateRangeFromEnd();
            if (sizesChanged) {
                this._events._emit(VirtualScrollerEventFlag.SIZES);
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
        this._scrollToIndexTimer = 0;
        this._scrollerOffsetTimer = 0;
        this._pointerActive = false;
        this._pendingScrollOffset = 0.0;
        this._pendingScrollCorrection = ScrollCorrection.NONE;
        this._initialElement = null;
        this._items._dispose();
        this._sticky._dispose();
        this._events._dispose();
    }
}

export default VirtualScroller;
