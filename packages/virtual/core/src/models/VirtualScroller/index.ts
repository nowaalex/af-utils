import {
    InternalEvent,
    ScrollElementSizeKey,
    ResizeObserverSizeKey,
    ScrollKey,
    ScrollToKey,
    _ALL_EVENTS,
    VirtualScrollerEvent
} from "constants/";
import FTreeArray from "models/FTreeArray";
import FinalResizeObserver from "models/ResizeObserver";
import call from "utils/call";
import assert from "utils/assert";
import observeResize from "utils/observeResize";
import growTypedArray from "utils/growTypedArray";
import { update, getLiftingLimit, syncWithArray } from "utils/fTree";
import getDistanceBetween from "utils/getDistanceBetween";
import Batch from "singletons/Batch";
import type {
    VirtualScrollerScrollElement,
    VirtualScrollerInitialParams,
    VirtualScrollerRuntimeParams,
    VirtualScrollerExactPosition
} from "types";

const OBSERVE_OPTIONS = {
    box: "border-box"
} as const satisfies ResizeObserverOptions;

const ITEMS_ROOM = 32;

const DEFAULT_OVERSCAN_COUNT = 6;

const DEFAULT_ESTIMATED_WIDGET_SIZE = 200;

const DEFAULT_ESTIMATED_ITEM_SIZE = 40;

/*
    0x7fffffff - maximum 32bit integer.
    Bitwise operations, used in fenwick tree, cannot be applied to numbers > int32.
*/
const MAX_INT_32 = 0x7fffffff;

/* 
    Creating fenwick tree from an array in linear time;
    It is much more efficient, than calling updateItemHeight N times.
*/

const EMPTY_TYPED_ARRAY = new FTreeArray(0);

const STICKY_HEADER_INDEX = 0;
const STICKY_FOOTER_INDEX = 1;

/* Creating specially-indexed arrays to avoid long switch-cases */
const ScrollElementSizeKeysOrdered = [
    ScrollElementSizeKey.ELEMENT_VERTICAL,
    ScrollElementSizeKey.ELEMENT_HORIZONTAL,
    ScrollElementSizeKey.WINDOW_VERTICAL,
    ScrollElementSizeKey.WINDOW_HORIZONTAL
] as const;

const ScrollKeysOrdered = [
    ScrollKey.ELEMENT_VERTICAL,
    ScrollKey.ELEMENT_HORIZONTAL,
    ScrollKey.WINDOW_VERTICAL,
    ScrollKey.WINDOW_HORIZONTAL
] as const;

const ResizeObserverSizeKeysOrdered = [
    ResizeObserverSizeKey.VERTICAL,
    ResizeObserverSizeKey.HORIZONTAL
] as const;

const ScrollToKeysOrdered = [
    ScrollToKey.VERTICAL,
    ScrollToKey.HORIZONTAL
] as const;

const getBoxSize = (
    borderBox: readonly ResizeObserverSize[],
    sizeKey: ResizeObserverSizeKey
) => Math.round(borderBox[0][sizeKey]);

const getAvailableWidgetSize = (
    scrollElement: VirtualScrollerScrollElement,
    sizeKey: ScrollElementSizeKey,
    stickyOffset: number
) => (scrollElement as any)[sizeKey] - stickyOffset;

const BORROW_EVENTS = ["scrollend", "pointerdown", "wheel", "keydown"] as const;
const SCROLL_EVENT = ["scroll"] as const;

const toggleEvents = (
    events: readonly string[] | string[],
    el: VirtualScrollerScrollElement | null,
    callBack: EventListener,
    flag: boolean
) =>
    events.forEach(
        e =>
            el?.[`${flag ? "add" : "remove"}EventListener`](e, callBack, {
                passive: true
            })
    );

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
 * - emits and allows to subscribe to {@link @af-utils/virtual-core#(VirtualScrollerEvent:variable) | events}.
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
    private _scrollElementSizeKey: ScrollElementSizeKey =
        ScrollElementSizeKeysOrdered[0];
    private _scrollKey: ScrollKey = ScrollKeysOrdered[0];
    private _resizeObserverSizeKey: ResizeObserverSizeKey =
        ResizeObserverSizeKeysOrdered[0];
    private _scrollToKey: ScrollToKey = ScrollToKeysOrdered[0];
    private _desiredScrollIndex = 0;
    private _desiredScrollSmooth = false;
    private _reachedScrollTs = MAX_INT_32;
    private _scrollBorrowed = false;

    /* It is more useful to store scrollPos - scrollElementOffset in one variable for future calculations */
    private _alignedScrollPos = 0;
    private _scrollElementOffset = 0;

    private _stickyOffset = 0;

    /** {@inheritDoc VirtualScrollerRuntimeParams.itemCount} */
    private _itemCount = 0;
    private _availableWidgetSize = 0;

    /** {@inheritDoc VirtualScrollerRuntimeParams.overscanCount} */
    private _overscanCount = DEFAULT_OVERSCAN_COUNT;

    /** {@inheritDoc VirtualScrollerRuntimeParams.estimatedItemSize} */
    private _estimatedItemSize = DEFAULT_ESTIMATED_ITEM_SIZE;

    private _scrollElement: VirtualScrollerScrollElement | null = null;
    private _initialElement: HTMLElement | null = null;

    private _itemSizes = EMPTY_TYPED_ARRAY;
    private _fTree = EMPTY_TYPED_ARRAY;

    /**
     * Most significant bit of this._itemCount;
     * caching it to avoid Math.clz32 calculations on every getIndex call
     */
    private _msb = 0;

    /** @readonly {@inheritDoc VirtualScrollerInitialParams.horizontal} */
    horizontal = false;

    /**
     * @readonly
     * Sum of all item sizes */
    scrollSize = 0;

    /**
     * @readonly
     * Items range start with {@link VirtualScrollerRuntimeParams.overscanCount | overscanCount} included */
    from = 0;

    /**
     * @readonly
     * Items range end with {@link VirtualScrollerRuntimeParams.overscanCount | overscanCount} included */
    to = 0;

    /**
     * @readonly
     * Hash of item sizes. Changed when at least one visible item is resized */
    sizesHash = 0;

    private _elToIdx = new Map<Element, number>();
    private _idxToEl = new Map<number, Element>();

    /* header and footer; lengths are hardcoded */
    private _stickyElements: [Element | null, Element | null] = [null, null];
    private _stickyElementsSizes: [number, number] = [0, 0];

    private _StickyElResizeObserver = new FinalResizeObserver(entries => {
        let buff = 0;

        for (const entry of entries) {
            const index = this._stickyElements.indexOf(entry.target);
            if (index !== -1) {
                const diff =
                    getBoxSize(
                        entry.borderBoxSize,
                        this._resizeObserverSizeKey
                    ) - this._stickyElementsSizes[index];

                this._stickyElementsSizes[index] += diff;
                buff += diff;
            }
        }

        this._updateStickyOffset(buff);
    });

    private _ElResizeObserver = new FinalResizeObserver(entries => {
        let buff = 0,
            wasAtLeastOneSizeChanged = false;

        const lim = /*@__NOINLINE__*/ getLiftingLimit(
            this._fTree,
            this.from + 1,
            this.to
        );

        /*
            TODO: check perf of borderBoxSize vs offsetWidth/offsetHeight
        */
        for (const entry of entries) {
            // cannot be undefined, because element is being added to this map before getting into ResizeObserver
            const index = this._elToIdx.get(entry.target) as number;

            /*
                ResizeObserver may give us elements, which are not in visible range => will be unmounted soon.
                Should not take them into account.
                This is done for performance + updateItemHeight hack would not work without it
            */
            if (index < lim) {
                const diff =
                    getBoxSize(
                        entry.borderBoxSize,
                        this._resizeObserverSizeKey
                    ) - this._itemSizes[index];
                if (diff) {
                    wasAtLeastOneSizeChanged = true;
                    this._itemSizes[index] += diff;
                    buff += diff;
                    update(this._fTree, index + 1, diff, lim);
                }
            }
        }

        if (wasAtLeastOneSizeChanged) {
            Batch._start();

            if (buff !== 0) {
                update(this._fTree, lim, buff, this._fTree.length);
                this.scrollSize += buff;
                this._run(InternalEvent.SCROLL_SIZE);

                if (buff < 0) {
                    /*
                        If visible item sizes reduced - holes may appear, so rerender is a must.
                        No holes possible if item sizes increased => no need to rerender.
                    */
                    this._updateRangeFromEnd();
                }
            }

            /*
                Modulo is used to prevent sizesHash from growing too much.
                Using bitwise hack to optimize modulo.
                5 % 2 === 5 & 1 && 9 % 4 === 9 & 3
            */
            this.sizesHash = (this.sizesHash + 1) & MAX_INT_32;
            this._run(InternalEvent.SIZES);

            Batch._end();
        }
    });

    private _EventsList = _ALL_EVENTS.map<(() => void)[]>(() => []);

    /**
     * Update property names for resize events, dimensions and scroll position extraction
     *
     * @remarks
     * `window.resize` event must be used for window scroller, `ResizeObserver` must be used in other cases.
     * `offsetWidth` is used as item size in horizontal mode, `offsetHeight` - in vertical.
     */
    private _updatePropertyKeys() {
        const h = this.horizontal ? 1 : 0;
        const w = this._scrollElement instanceof HTMLElement ? 0 : 1;
        const i = h + 2 * w;

        this._scrollElementSizeKey = ScrollElementSizeKeysOrdered[i];
        this._scrollKey = ScrollKeysOrdered[i];
        this._resizeObserverSizeKey = ResizeObserverSizeKeysOrdered[h];
        this._scrollToKey = ScrollToKeysOrdered[h];
    }

    private _handleScrollElementResize = () => {
        const availableWidgetSize = getAvailableWidgetSize(
            // casting type here because this stuff is used only as scrollElement resize event handler
            this._scrollElement as VirtualScrollerScrollElement,
            this._scrollElementSizeKey,
            this._stickyOffset
        );

        if (availableWidgetSize !== this._availableWidgetSize) {
            this._availableWidgetSize = availableWidgetSize;
            this._updateRangeFromEnd();
        }
    };

    private _updateStickyOffset(relativeOffset: number) {
        if (relativeOffset) {
            Batch._start();
            this._stickyOffset += relativeOffset;
            this._availableWidgetSize -= relativeOffset;
            this._run(InternalEvent.SCROLL_SIZE);
            this._updateRangeFromEnd();
            Batch._end();
        }
    }

    private _unobserveResize = () => {};

    constructor(params?: VirtualScrollerInitialParams) {
        if (params) {
            this.horizontal = !!params.horizontal;
            // stickyOffset is included;
            this._scrollElementOffset =
                params.estimatedScrollElementOffset || 0;
            this._availableWidgetSize =
                params.estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE;
            this.set(params);
        }
    }

    /**
     * Unsubscribe from model events
     * @param callBack - callBack to unsubscribe
     * @param events - events to unsubscribe
     */
    private _off(
        callBack: () => void,
        events: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[]
    ) {
        events.forEach(evt =>
            this._EventsList[evt].splice(
                // >>> 0 - protection against -1
                this._EventsList[evt].indexOf(callBack) >>> 0,
                1
            )
        );
    }

    /**
     * Subscribe to model events
     * @returns unsubscribe function
     * @param callBack - event to be triggered
     * @param events - events to subscribe
     */
    on(
        callBack: () => void,
        events: readonly VirtualScrollerEvent[] | VirtualScrollerEvent[]
    ) {
        events.forEach(evt => this._EventsList[evt].push(callBack));
        return () => this._off(callBack, events);
    }

    /**
     * Call all `event` subscribers
     * @param event - event to emit
     */
    private _run(event: VirtualScrollerEvent) {
        this._EventsList[event].forEach(
            Batch._level === 0 ? call : Batch._queue
        );
    }

    /**
     * Get item index by pixel offset;
     * @param offset - pixel offset
     * @returns item index;
     *
     * @remarks
     * Time complexity: `O(log2(itemCount))`
     */
    getIndex(offset: number) {
        if (offset <= 0) {
            return 0;
        }

        if (offset >= this.scrollSize) {
            return this._itemCount - 1;
        }

        let index = 0;

        for (
            let bitMask = this._msb, tempIndex = 0;
            bitMask > 0;
            bitMask >>= 1
        ) {
            tempIndex = index + bitMask;
            if (
                tempIndex <= this._itemCount &&
                offset > this._fTree[tempIndex]
            ) {
                index = tempIndex;
                offset -= this._fTree[tempIndex];
            }
        }

        return index;
    }

    /**
     * Get pixel offset by item index;
     * @param index - item index
     * @returns pixel offset
     *
     * @remarks
     * Time complexity: `O(log2(itemCount))`
     */
    getOffset(index: number) {
        if (process.env.NODE_ENV !== "production") {
            assert(index <= this._itemCount, "index must not be > itemCount");
        }

        let result = 0;

        for (; index > 0; index -= index & -index) {
            result += this._fTree[index];
        }

        return result;
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
            assert(
                itemIndex < this._itemSizes.length,
                "itemIndex must be < itemCount in getSize"
            );
        }
        return this._itemSizes[itemIndex];
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
        const firstVisibleIndex = this._exactFrom;
        return (
            firstVisibleIndex +
            (this._alignedScrollPos - this.getOffset(firstVisibleIndex)) /
                this._itemSizes[firstVisibleIndex]
        );
    }

    /**
     * Synchronize current scroll position with visible range
     */
    private _syncScrollPosition() {
        /*
            scrollElement may not be null here.
            Math.round, because scrollY/scrollX may be float on Safari
        */
        const curAlignedScrollPos = this._alignedScrollPos,
            newAlignedScrollPos =
                Math.round((this._scrollElement as any)[this._scrollKey]) -
                this._scrollElementOffset;

        if (newAlignedScrollPos !== curAlignedScrollPos) {
            this._alignedScrollPos = newAlignedScrollPos;

            if (newAlignedScrollPos > curAlignedScrollPos) {
                this._updateRangeFromEnd();
            } else {
                this._updateRangeFromStart();
            }
        }
    }

    private _handleScrollEvent = (e: Event) => {
        switch (e.type) {
            case "scroll":
                this._syncScrollPosition();
                break;
            case "scrollend":
                if (this._scrollBorrowed) {
                    this._attemptToScrollIfNeeded(e.timeStamp);
                }
                break;
            default:
                this._toggleScrollBorrow(false);
        }
    };

    private _handleResizeAfterScroll = () => {
        if (this._scrollBorrowed) {
            const now = performance.now();

            if (now - this._reachedScrollTs < 128) {
                queueMicrotask(() => {
                    this._attemptToScrollIfNeeded(now);
                });
            }
        }
    };

    private _toggleScrollBorrow = (flag: boolean) => {
        if (this._scrollBorrowed !== flag) {
            this._scrollBorrowed = flag;
            toggleEvents(
                BORROW_EVENTS,
                this._scrollElement,
                this._handleScrollEvent,
                flag
            );
            this[flag ? "on" : "_off"](this._handleResizeAfterScroll, [
                InternalEvent.SCROLL_SIZE
            ]);
        }
    };

    /**
     * Informs model about scrollable element.
     * @param element - scroller element
     *
     * @remarks
     * Must be called with `null` before killing the instance.
     */
    setScroller(element: VirtualScrollerScrollElement | null) {
        if (element !== this._scrollElement) {
            this._unobserveResize();
            this._toggleScrollBorrow(false);
            toggleEvents(
                SCROLL_EVENT,
                this._scrollElement,
                this._handleScrollEvent,
                false
            );

            this._scrollElement = element;

            if (element) {
                this._updatePropertyKeys();
                this._unobserveResize = /*@__NOINLINE__*/ observeResize(
                    element,
                    this._handleScrollElementResize
                );
                toggleEvents(
                    SCROLL_EVENT,
                    element,
                    this._handleScrollEvent,
                    true
                );
                this._updateScrollerOffsetRaw();
                this._syncScrollPosition();
            }
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
     * <ScrollContainer>            |.|
     *    Some header               |s|
     *    Another header            |c|
     *    <ItemsContainer>          |r|
     *         item 1               [o]
     *         item 2               [l]
     *         item 3               [l]
     *         ...                  [b]
     *    </ItemsContainer>         |a|
     *    Some footer               |r|
     * </ScrollContainer>           |.|
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

    private _updateScrollerOffsetRaw() {
        const newScrollElementOffset = /*@__NOINLINE__*/ getDistanceBetween(
            this._scrollElement,
            this._initialElement,
            this._scrollKey,
            this._scrollToKey
        );
        const diff = newScrollElementOffset - this._scrollElementOffset;

        this._scrollElementOffset += diff;
        this._alignedScrollPos -= diff;

        return diff;
    }

    private updateScrollerOffset() {
        if (this._updateScrollerOffsetRaw() && this._scrollElement) {
            this._syncScrollPosition();
        }
    }

    /**
     * Start/finish observing size of `element` at `index`. Observing is finished if element is `null`.
     * @param index - item index
     * @param element - element for item
     *
     * @remarks
     * If an item was registered like `el(5, HTMLElement)` - it must be killed with `el(5, null)` before killing the instance.
     */
    el(index: number, element: HTMLElement | null) {
        const oldElement = this._idxToEl.get(index);

        if (oldElement) {
            this._idxToEl.delete(index);
            this._elToIdx.delete(oldElement);
            this._ElResizeObserver.unobserve(oldElement);
        }

        if (element) {
            this._elToIdx.set(element, index);
            this._idxToEl.set(index, element);
            this._ElResizeObserver.observe(element, OBSERVE_OPTIONS);
        }
    }

    private _stickyEl(i: 0 | 1, element: HTMLElement | null) {
        const oldElement = this._stickyElements[i];

        if (oldElement) {
            this._StickyElResizeObserver.unobserve(oldElement);
            this._updateStickyOffset(-this._stickyElementsSizes[i]);
            this._stickyElements[i] = null;
            this._stickyElementsSizes[i] = 0;
        }

        if (element) {
            this._stickyElements[i] = element;
            this._StickyElResizeObserver.observe(element, OBSERVE_OPTIONS);
        }
    }

    /**
     * Start observing size of sticky header `element`. Observing is finished if element is `null`.
     * @param element - header element
     *
     * @remarks
     * Must be called with `null` before killing the instance.
     */
    setStickyHeader(element: HTMLElement | null) {
        this._stickyEl(STICKY_HEADER_INDEX, element);
    }

    /**
     * Start observing size of sticky footer `element`. Observing is finished if element is `null`.
     * @param element - footer element
     *
     * @remarks
     * Must be called with `null` before killing the instance.
     */
    setStickyFooter(element: HTMLElement | null) {
        this._stickyEl(STICKY_FOOTER_INDEX, element);
    }

    /**
     * Get first visible item index (without overscan)
     * @returns first visible item index
     */
    private get _exactFrom() {
        return this.getIndex(this._alignedScrollPos);
    }

    /**
     * Get last visible item index (without overscan)
     * @returns last visible item index
     */
    private get _exactTo() {
        return (
            this._itemCount &&
            1 +
                this.getIndex(
                    this._alignedScrollPos + this._availableWidgetSize
                )
        );
    }

    /**
     * Used to update current visible items range when scrolling down/right;
     * adds overscan reserve forward to reduce rerenders quantity
     */
    private _updateRangeFromEnd() {
        const { _exactTo } = this;

        if (_exactTo > this.to) {
            this.to = Math.min(this._itemCount, _exactTo + this._overscanCount);
            this.from = this._exactFrom;
            this._run(InternalEvent.RANGE);
        }
    }

    /**
     * Used to update current visible items range when scrolling up/left;
     * adds overscan reserve backward to reduce rerenders quantity
     */
    private _updateRangeFromStart() {
        const { _exactFrom } = this;

        if (_exactFrom < this.from) {
            this.from = Math.max(0, _exactFrom - this._overscanCount);
            this.to = this._exactTo;
            this._run(InternalEvent.RANGE);
        }
    }

    private _attemptToScrollIfNeeded(timeStamp: number) {
        const whole = Math.trunc(this._desiredScrollIndex);

        const desiredScrollPos = Math.min(
            this.scrollSize - this._availableWidgetSize,
            this.getOffset(whole) +
                Math.round(
                    this._itemSizes[whole] * (this._desiredScrollIndex - whole)
                )
        );

        if (desiredScrollPos !== this._alignedScrollPos) {
            this.scrollToOffset(desiredScrollPos, this._desiredScrollSmooth);
        } else {
            this._reachedScrollTs = timeStamp;
        }
    }

    /**
     * Scroll to pixel offset
     *
     * @param offset - offset to scroll to
     * @param smooth - should smooth scroll be used
     */
    scrollToOffset(offset: number, smooth?: boolean) {
        this._scrollElement?.scroll({
            [this._scrollToKey]: this._scrollElementOffset + offset,
            behavior: smooth ? "smooth" : "instant"
        });
    }

    /**
     * Scroll to item index
     *
     * @param index - item index to scroll to
     * @param smooth - should smooth scroll be used
     *
     * @remarks
     * Calls {@link VirtualScroller.scrollToOffset | scrollToOffset} with calcuated offset until desired scroll position is reached.
     * This method relies on `scrollend` event.
     */
    scrollToIndex(index: VirtualScrollerExactPosition, smooth?: boolean) {
        this._toggleScrollBorrow(true);
        this._desiredScrollIndex = index;
        this._desiredScrollSmooth = !!smooth;
        this._attemptToScrollIfNeeded(performance.now());
    }

    /**
     * Notify model about items quantity change
     * @param itemCount - new items quantity. {@link VirtualScrollerRuntimeParams.itemCount}
     */
    setItemCount(itemCount: number) {
        if (this._itemCount !== itemCount) {
            Batch._start();

            assert(
                itemCount <= MAX_INT_32,
                `itemCount must be <= ${MAX_INT_32}. Got: ${itemCount}.`
            );

            this._itemCount = itemCount;
            this._msb = itemCount && 1 << (31 - Math.clz32(itemCount));

            if (itemCount > this._itemSizes.length) {
                const newLen = Math.min(itemCount + ITEMS_ROOM, MAX_INT_32);
                this._itemSizes = /*@__NOINLINE__*/ growTypedArray(
                    this._itemSizes,
                    newLen,
                    this._estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE
                );
                this._fTree = new FTreeArray(newLen + 1);
                /*@__NOINLINE__*/ syncWithArray(this._fTree, this._itemSizes);
            }

            this.scrollSize = this.getOffset(itemCount);

            this._run(InternalEvent.SCROLL_SIZE);

            if (this.to > itemCount) {
                // after this range would be 100% updated
                this.to = -1;
            }

            this._updateRangeFromEnd();

            Batch._end();
        }
    }

    /**
     * Synchronize runtime parameters
     * @param runtimeParams - runtime parameters
     */
    set(runtimeParams: VirtualScrollerRuntimeParams) {
        if (runtimeParams.estimatedItemSize) {
            // must not be falsy, so not checking for undefined here.
            this._estimatedItemSize = runtimeParams.estimatedItemSize;
        }

        if (runtimeParams.overscanCount !== undefined) {
            this._overscanCount = runtimeParams.overscanCount;
        }

        if (runtimeParams.itemCount !== undefined) {
            this.setItemCount(runtimeParams.itemCount);
        }
    }
}

export default VirtualScroller;
