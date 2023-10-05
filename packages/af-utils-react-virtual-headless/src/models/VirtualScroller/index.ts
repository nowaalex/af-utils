import {
    SIZES_HASH_MODULO,
    Event,
    ScrollElementSizeKey,
    ResizeObserverSizeKey,
    ScrollKey,
    ScrollToKey,
    EVT_ALL,
    MAX_ITEM_COUNT,
    DEFAULT_ESTIMATED_ITEM_SIZE,
    DEFAULT_OVERSCAN_COUNT,
    DEFAULT_ESTIMATED_WIDGET_SIZE
} from "constants/index";
import FTreeArray from "models/FTreeArray";
import FinalResizeObserver from "models/ResizeObserver";
import call from "utils/call";
import assert from "utils/assert";
import observeResize from "utils/observeResize";
import isElement from "utils/isElement";
import growTypedArray from "utils/growTypedArray";
import { build as buildFtree, update, getLiftingLimit } from "utils/fTree";
import getDistanceBetween from "utils/getDistanceBetween";
import Batch from "singletons/Batch";
import type {
    ScrollElement,
    VirtualScrollerInitialParams,
    VirtualScrollerRuntimeParams
} from "types";

const OBSERVE_OPTIONS = {
    box: "border-box"
} as const satisfies ResizeObserverOptions;

const SCROLL_EVENT_OPTIONS = {
    passive: true
} as const satisfies AddEventListenerOptions;

const ITEMS_ROOM = 32;

/*
    Chrome works ok with 0;
    FF needs some timer to place scrollTo call after ResizeObserver callback
*/
const NON_SMOOTH_SCROLL_CHECK_TIMER = 32;

const SMOOTH_SCROLL_CHECK_TIMER = 512;

const SCROLL_TO_MAX_ATTEMPTS = 16;

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
    scrollElement: ScrollElement,
    sizeKey: ScrollElementSizeKey,
    stickyOffset: number
) => (scrollElement as any)[sizeKey] - stickyOffset;

class VirtualScroller {
    private _scrollElementSizeKey: ScrollElementSizeKey =
        ScrollElementSizeKeysOrdered[0];
    private _scrollKey: ScrollKey = ScrollKeysOrdered[0];
    private _resizeObserverSizeKey: ResizeObserverSizeKey =
        ResizeObserverSizeKeysOrdered[0];
    private _scrollToKey: ScrollToKey = ScrollToKeysOrdered[0];

    /*
        When using window scroll mode, some blocks may go before & after virtual container.

        [ ---- window start ---- ] |.|
        Some header                |s|
        Another header             |c|
        <Virtual>                  |r|
            item 1                 [o]
            item 2                 [l]
            item 3                 [l]
            ...                    [b]
        </Virtual>                 |a|
        Some footer                |r|
        [ ----  window end  ---- ] |.|

        Actually any div may be used instead of window, but offset should be calculated.
    */

    /* It is more useful to store scrollPos - scrollElementOffset in one variable for future calculations */
    private _alignedScrollPos = 0;
    private _scrollElementOffset = 0;

    private _rawScrollSize = 0;
    private _stickyOffset = 0;
    private _itemCount = 0;
    private _availableWidgetSize = 0;
    private _scrollToTimer: ReturnType<typeof setTimeout> | 0 = 0;
    private _overscanCount = DEFAULT_OVERSCAN_COUNT;
    private _estimatedItemSize = DEFAULT_ESTIMATED_ITEM_SIZE;

    private _scrollElement: ScrollElement | null = null;
    private _initialElement: Element | null = null;

    private _itemSizes = EMPTY_TYPED_ARRAY;
    private _fTree = EMPTY_TYPED_ARRAY;

    /**
     * Most significant bit of this._itemCount;
     * caching it to avoid Math.clz32 calculations on every getIndex call
     */
    private _msb = 0;

    /** Scroll direction */
    horizontal = false;

    /** Sum of all item sizes */
    scrollSize = 0;

    /** Items range start */
    from = 0;

    /** Items range end */
    to = 0;

    /** Hash of item sizes. Changed when at least one visible item is resized. */
    sizesHash = 0;

    private _elToIdx = new Map<Element, number>();
    private _idxToEl = new Map<number, Element>();

    /* header and footer; lengths are hardcoded */
    private _stickyElements: [Element | null, Element | null] = [null, null];
    private _stickyElementsSizes: [number, number] = [0, 0];

    private _StickyElResizeObserver = new FinalResizeObserver(entries => {
        let index = 0,
            diff = 0,
            buff = 0;

        for (const { target, borderBoxSize } of entries) {
            index = this._stickyElements.indexOf(target);
            if (index !== -1) {
                diff =
                    getBoxSize(borderBoxSize, this._resizeObserverSizeKey) -
                    this._stickyElementsSizes[index];
                if (diff) {
                    this._stickyElementsSizes[index] += diff;
                    buff += diff;
                }
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
        for (const { target, borderBoxSize } of entries) {
            // cannot be undefined, because element is being added to this map before getting into ResizeObserver
            const index = this._elToIdx.get(target) as number;

            /*
                ResizeObserver may give us elements, which are not in visible range => will be unmounted soon.
                Should not take them into account.
                This is done for performance + updateItemHeight hack would not work without it
            */
            if (index < lim) {
                const diff =
                    getBoxSize(borderBoxSize, this._resizeObserverSizeKey) -
                    this._itemSizes[index];
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
                this._rawScrollSize += buff;
                this.scrollSize += buff;
                this._run(Event.SCROLL_SIZE);
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
            this.sizesHash = (this.sizesHash + 1) & SIZES_HASH_MODULO;
            this._run(Event.SIZES);

            Batch._end();
        }
    });

    private _EventsList = EVT_ALL.map<(() => void)[]>(() => []);

    /**
     * Update property names for resize events, dimensions and scroll position extraction
     *
     * @remarks
     *
     * `window.resize` event must be used for window scroller, `ResizeObserver` must be used in other cases.
     * `offsetWidth` is used as item size in horizontal mode, `offsetHeight` - in vertical.
     */
    private _updatePropertyKeys() {
        const h = this.horizontal ? 1 : 0;
        const w = isElement(this._scrollElement as Element) ? 0 : 1;
        const i = h + 2 * w;

        this._scrollElementSizeKey = ScrollElementSizeKeysOrdered[i];
        this._scrollKey = ScrollKeysOrdered[i];
        this._resizeObserverSizeKey = ResizeObserverSizeKeysOrdered[h];
        this._scrollToKey = ScrollToKeysOrdered[h];
    }

    private _handleScrollElementResize = () => {
        const availableWidgetSize = getAvailableWidgetSize(
            // casting type here because this stuff is used only as scrollElement resize event handler
            this._scrollElement as ScrollElement,
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
            this.scrollSize += relativeOffset;
            this._run(Event.SCROLL_SIZE);
            this._updateRangeFromEnd();
            Batch._end();
        }
    }

    private _unobserveResize = () => {
        // nothing to unobserve initially
    };

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
     * Subscribe to model events
     *
     * @param callBack - event to be triggered
     * @param events - events to subscribe
     *
     * @returns unsubscribe function
     */
    on(callBack: () => void, events: Event[]) {
        events.forEach(evt => this._EventsList[evt].push(callBack));
        return () =>
            events.forEach(evt =>
                this._EventsList[evt].splice(
                    this._EventsList[evt].indexOf(callBack),
                    1
                )
            );
    }

    /**
     * Call all `event` subscribers
     * @param event - event to emit
     */
    private _run(event: Event) {
        this._EventsList[event].forEach(
            Batch._level === 0 ? call : Batch._queue
        );
    }

    /**
     * Get item index by pixel offset
     *
     * @param offset - pixel offset
     * @returns item index
     */
    getIndex(offset: number) {
        if (offset <= 0) {
            return 0;
        }

        if (offset >= this._rawScrollSize) {
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
     * Get pixel offset by item index
     *
     * @param index - item index
     * @returns pixel offset
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
     * @param itemIndex - item index
     * @returns last cached item size
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
     * Get snapshot of current scroll position.
     *
     * @remarks
     *
     * For example `5.3` stands for item at index `5` + `30%` of its size.
     * Used to remember scroll position before prepending elements.
     *
     * @returns visible item index (double number)
     */
    get visibleFrom() {
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
    private _syncScrollPosition = () => {
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
    };

    /*
        Performs as destructor when null is passed
        will ne used as callback, so using =>
    */
    setScroller = (element: ScrollElement | null) => {
        if (element !== this._scrollElement) {
            this._unobserveResize();
            this._scrollElement?.removeEventListener(
                "scroll",
                this._syncScrollPosition
            );

            this._scrollElement = element;

            if (element) {
                this._updatePropertyKeys();
                this._unobserveResize = /*@__NOINLINE__*/ observeResize(
                    element,
                    this._handleScrollElementResize
                );
                element.addEventListener(
                    "scroll",
                    this._syncScrollPosition,
                    SCROLL_EVENT_OPTIONS
                );
                this._updateScrollerOffsetRaw();
                this._syncScrollPosition();
            } else {
                this._ElResizeObserver.disconnect();
                this._StickyElResizeObserver.disconnect();
                clearTimeout(this._scrollToTimer);
            }
        }
    };

    setContainer = (element: Element | null) => {
        if (element !== this._initialElement) {
            this._initialElement = element;
            this.updateScrollerOffset();
        }
    };

    _updateScrollerOffsetRaw() {
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

    updateScrollerOffset() {
        if (this._updateScrollerOffsetRaw() && this._scrollElement) {
            this._syncScrollPosition();
        }
    }

    /**
     * Start observing size of `element` at `index`. Observing is finished if element is falsy.
     * @param index - item index
     * @param element - element for item
     */
    el(index: number, element: Element | null) {
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

    private _stickyEl(i: number, element: Element | null) {
        const oldElement = this._stickyElements[i];

        if (oldElement) {
            this._StickyElResizeObserver.unobserve(oldElement);
            this._updateStickyOffset(-this._stickyElementsSizes[i]);
            this._stickyElements[i] = null;
            this._stickyElementsSizes[i] = 0;
        }

        if (element) {
            this._StickyElResizeObserver.observe(
                (this._stickyElements[i] = element),
                OBSERVE_OPTIONS
            );
        }
    }

    /**
     * Start observing size of sticky header `element`. Observing is finished if element is falsy.
     * @param element - header element
     */
    setStickyHeader(element: Element | null) {
        this._stickyEl(STICKY_HEADER_INDEX, element);
    }

    /**
     * Start observing size of sticky footer `element`. Observing is finished if element is falsy.
     * @param element - footer element
     */
    setStickyFooter(element: Element | null) {
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
            this._run(Event.RANGE);
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
            this._run(Event.RANGE);
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
            behavior: smooth ? "smooth" : undefined
        });
    }

    private _attemptToScrollToIndex(
        attemptsLeft: number,
        index: number,
        smooth?: boolean
    ) {
        clearTimeout(this._scrollToTimer);

        const whole = index | 0;
        const desiredScrollPos = Math.min(
            this.scrollSize - this._availableWidgetSize,
            this.getOffset(whole) +
                Math.round(this._itemSizes[whole] * (index - whole))
        );

        if (
            desiredScrollPos !== this._alignedScrollPos &&
            this._scrollElement &&
            --attemptsLeft
        ) {
            this.scrollToOffset(desiredScrollPos, smooth);

            this._scrollToTimer = setTimeout(
                () => this._attemptToScrollToIndex(attemptsLeft, index, smooth),
                smooth
                    ? SMOOTH_SCROLL_CHECK_TIMER
                    : NON_SMOOTH_SCROLL_CHECK_TIMER
            );
        }
    }

    /**
     * Scroll to item index
     *
     * @param index - item index to scroll to
     * @param smooth - should smooth scroll be used
     */
    scrollToIndex(index: number, smooth?: boolean) {
        this._attemptToScrollToIndex(SCROLL_TO_MAX_ATTEMPTS, index, smooth);
    }

    /**
     * Notify model about items quantity change
     * @param itemCount - new items quantity
     */
    setItemCount(itemCount: number) {
        if (this._itemCount !== itemCount) {
            Batch._start();

            assert(
                itemCount <= MAX_ITEM_COUNT,
                `itemCount must be <= ${MAX_ITEM_COUNT}. Got: ${itemCount}.`
            );

            this._itemCount = itemCount;
            this._msb = itemCount && 1 << (31 - Math.clz32(itemCount));

            if (itemCount > this._itemSizes.length) {
                this._itemSizes = /*@__NOINLINE__*/ growTypedArray(
                    this._itemSizes,
                    Math.min(itemCount + ITEMS_ROOM, MAX_ITEM_COUNT),
                    this._estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE
                );
                this._fTree = /*@__NOINLINE__*/ buildFtree(this._itemSizes);
            }

            this._rawScrollSize = this.getOffset(itemCount);
            this.scrollSize = this._rawScrollSize + this._stickyOffset;

            this._run(Event.SCROLL_SIZE);

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
    set({
        overscanCount,
        itemCount,
        estimatedItemSize
    }: VirtualScrollerRuntimeParams) {
        if (estimatedItemSize) {
            // must not be falsy, so not checking for undefined here.
            this._estimatedItemSize = estimatedItemSize;
        }

        if (overscanCount !== undefined) {
            this._overscanCount = overscanCount;
        }

        if (itemCount !== undefined) {
            this.setItemCount(itemCount);
        }
    }
}

export default VirtualScroller;
