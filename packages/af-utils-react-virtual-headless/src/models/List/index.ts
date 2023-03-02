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
} from "constants/";
import FTreeArray from "models/FTreeArray";
import FinalResizeObserver from "models/ResizeObserver";
import call from "utils/call";
import observeResize from "utils/observeResize";
import { build, update, getLiftingLimit } from "utils/fTree";
import getDistanceBetween from "utils/getDistanceBetween";
import Batch from "singletons/Batch";

export type ScrollElement = HTMLElement & Window;

export type ListRuntimeParams = {
    overscanCount?: number;
    horizontal?: boolean;
    itemCount?: number;
    estimatedItemSize?: number;
};

export type ListInitialParams = ListRuntimeParams & {
    estimatedWidgetSize?: number;
    estimatedScrollElementOffset?: number;
};

const OBSERVE_OPTIONS: ResizeObserverOptions = {
    box: "border-box"
};

const SCROLL_EVENT_OPTIONS: AddEventListenerOptions = {
    passive: true
};

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
];

const ScrollKeysOrdered = [
    ScrollKey.ELEMENT_VERTICAL,
    ScrollKey.ELEMENT_HORIZONTAL,
    ScrollKey.WINDOW_VERTICAL,
    ScrollKey.WINDOW_HORIZONTAL
];

const ResizeObserverSizeKeysOrdered = [
    ResizeObserverSizeKey.VERTICAL,
    ResizeObserverSizeKey.HORIZONTAL
];

const ScrollToKeysOrdered = [ScrollToKey.VERTICAL, ScrollToKey.HORIZONTAL];

const getBoxSize = (
    borderBox: readonly ResizeObserverSize[],
    sizeKey: ResizeObserverSizeKey
) => Math.round(borderBox[0][sizeKey]);
class List {
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

    /*
        most significant bit of this._itemCount;
        caching it to avoid Math.clz32 calculations on every getIndex call
    */
    private _msb = 0;

    horizontal = false;

    scrollSize = 0;
    from = 0;
    to = 0;
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
        let index = 0,
            diff = 0,
            buff = 0,
            wasAtLeastOneSizeChanged = false,
            lim = /*@__NOINLINE__*/ getLiftingLimit(
                this._fTree,
                this.from + 1,
                this.to
            );

        /*
            TODO: check perf of borderBoxSize vs offsetWidth/offsetHeight
        */
        for (const { target, borderBoxSize } of entries) {
            // cannot be undefined, because element is being added to this map before getting into ResizeObserver
            index = this._elToIdx.get(target) as number;

            /*
                ResizeObserver may give us elements, which are not in visible range => will be unmounted soon.
                Should not take them into account.
                This is done for performance + updateItemHeight hack would not work without it
            */
            if (index < lim) {
                diff =
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

    private _EventsList: Array<Array<() => void>> = EVT_ALL.map(() => []);

    private _updatePropertyKeys() {
        const h = +this.horizontal;
        const w = +(this._scrollElement instanceof Window);
        const i = h + 2 * w;

        this._scrollElementSizeKey = ScrollElementSizeKeysOrdered[i];
        this._scrollKey = ScrollKeysOrdered[i];
        this._resizeObserverSizeKey = ResizeObserverSizeKeysOrdered[h];
        this._scrollToKey = ScrollToKeysOrdered[h];
    }

    private _updateWidgetSize = () => {
        const availableWidgetSize =
            (this._scrollElement as ScrollElement)[this._scrollElementSizeKey] -
            this._stickyOffset;

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

    private _unobserveResize = () => {};

    constructor(params?: ListInitialParams) {
        // stickyOffset is included;

        if (params) {
            this._scrollElementOffset =
                params.estimatedScrollElementOffset || 0;
            this._availableWidgetSize =
                params.estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE;
            this.set(params);
        }
    }

    on(callBack: () => void, deps: Array<Event>) {
        deps.forEach(evt => this._EventsList[evt].push(callBack));
        return () =>
            deps.forEach(evt =>
                this._EventsList[evt].splice(
                    this._EventsList[evt].indexOf(callBack),
                    1
                )
            );
    }

    private _run(evt: Event) {
        this._EventsList[evt].forEach(Batch._level === 0 ? call : Batch._queue);
    }

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
            if (
                (tempIndex = index + bitMask) <= this._itemCount &&
                offset > this._fTree[tempIndex]
            ) {
                index = tempIndex;
                offset -= this._fTree[tempIndex];
            }
        }

        return index;
    }

    getOffset(index: number) {
        if (process.env.NODE_ENV !== "production") {
            if (index > this._itemCount) {
                throw new Error("index must not be > itemCount");
            }
        }

        let result = 0;

        for (; index > 0; index -= index & -index) {
            result += this._fTree[index];
        }

        return result;
    }

    getSize(itemIndex: number) {
        if (process.env.NODE_ENV !== "production") {
            if (itemIndex >= this._itemSizes.length) {
                throw new Error("itemIndex must be < itemCount in getSize");
            }
        }
        return this._itemSizes[itemIndex];
    }

    get visibleFrom() {
        const firstVisibleIndex = this._exactFrom;
        return (
            firstVisibleIndex +
            (this._alignedScrollPos - this.getOffset(firstVisibleIndex)) /
                this._itemSizes[firstVisibleIndex]
        );
    }

    private _syncScrollPosition = () => {
        /*
            scrollElement may not be null here.
            Math.round, because scrollY/scrollX may be float on Safari
        */
        const curAlignedScrollPos = this._alignedScrollPos,
            newAlignedScrollPos =
                Math.round(
                    (this._scrollElement as ScrollElement)[this._scrollKey]
                ) - this._scrollElementOffset;

        if (newAlignedScrollPos !== curAlignedScrollPos) {
            if (
                (this._alignedScrollPos = newAlignedScrollPos) >
                curAlignedScrollPos
            ) {
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
            if (this._scrollElement) {
                this._unobserveResize();
                this._scrollElement.removeEventListener(
                    "scroll",
                    this._syncScrollPosition
                );
            }

            if ((this._scrollElement = element)) {
                this._updatePropertyKeys();
                this._unobserveResize = /*@__NOINLINE__*/ observeResize(
                    element,
                    this._updateWidgetSize
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

    el(i: number, element: Element) {
        const oldElement = this._idxToEl.get(i);

        if (oldElement) {
            this._idxToEl.delete(i);
            this._elToIdx.delete(oldElement);
            this._ElResizeObserver.unobserve(oldElement);
        }

        if (element) {
            this._elToIdx.set(element, i);
            this._idxToEl.set(i, element);
            this._ElResizeObserver.observe(element, OBSERVE_OPTIONS);
        }
    }

    private _stickyEl(i: number, element: Element) {
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

    setStickyHeader(element: Element) {
        this._stickyEl(STICKY_HEADER_INDEX, element);
    }

    setStickyFooter(element: Element) {
        this._stickyEl(STICKY_FOOTER_INDEX, element);
    }

    private get _exactFrom() {
        return this.getIndex(this._alignedScrollPos);
    }

    private get _exactTo() {
        return (
            this._itemCount &&
            1 +
                this.getIndex(
                    this._alignedScrollPos + this._availableWidgetSize
                )
        );
    }

    /*
        Used when scrolling down/right;
        adds overscan reserve forward to reduce rerenders quantity
    */
    private _updateRangeFromEnd() {
        const { _exactTo } = this;

        if (_exactTo > this.to) {
            this.to = Math.min(this._itemCount, _exactTo + this._overscanCount);
            this.from = this._exactFrom;
            this._run(Event.RANGE);
        }
    }

    /*
        Used when scrolling up/left;
        adds overscan reserve backward to reduce rerenders quantity
    */
    private _updateRangeFromStart() {
        const { _exactFrom } = this;

        if (_exactFrom < this.from) {
            this.from = Math.max(0, _exactFrom - this._overscanCount);
            this.to = this._exactTo;
            this._run(Event.RANGE);
        }
    }

    scrollTo(index: number, smooth?: boolean, attemptsLeft?: number) {
        clearTimeout(this._scrollToTimer);
        attemptsLeft ??= SCROLL_TO_MAX_ATTEMPTS;

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
            this._scrollElement.scroll({
                [this._scrollToKey]:
                    this._scrollElementOffset + desiredScrollPos,
                behavior: smooth ? "smooth" : undefined
            });

            this._scrollToTimer = setTimeout(
                () => this.scrollTo(index, smooth, attemptsLeft),
                smooth
                    ? SMOOTH_SCROLL_CHECK_TIMER
                    : NON_SMOOTH_SCROLL_CHECK_TIMER
            );
        }
    }

    set({
        overscanCount,
        horizontal,
        itemCount,
        estimatedItemSize
    }: ListRuntimeParams) {
        Batch._start();

        if (estimatedItemSize) {
            // must not be falsy, so not checking for undefined here.
            this._estimatedItemSize = estimatedItemSize;
        }

        if (overscanCount !== undefined) {
            this._overscanCount = overscanCount;
        }

        if (itemCount !== undefined && this._itemCount !== itemCount) {
            if (itemCount > MAX_ITEM_COUNT) {
                throw new Error(
                    `itemCount must be <= ${MAX_ITEM_COUNT}. Got: ${itemCount}.`
                );
            }
            this._msb =
                (this._itemCount = itemCount) &&
                1 << (31 - Math.clz32(itemCount));

            const oldItemSizes = this._itemSizes;
            const curRowHeighsLength = oldItemSizes.length;

            if (itemCount > curRowHeighsLength) {
                (this._itemSizes = new FTreeArray(
                    Math.min(itemCount + ITEMS_ROOM, MAX_ITEM_COUNT)
                )).set(oldItemSizes);

                this._fTree = /*@__NOINLINE__*/ build(
                    this._itemSizes.fill(
                        this._estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE,
                        curRowHeighsLength
                    )
                );
            }

            this.scrollSize =
                (this._rawScrollSize = this.getOffset(itemCount)) +
                this._stickyOffset;

            this._run(Event.SCROLL_SIZE);

            if (this.to > itemCount) {
                /*
                    We already reached scroll end. It is possible to scroll only backwards at this moment.
                    So will let overscan help us here;
                */
                this.from = MAX_ITEM_COUNT;
                this._updateRangeFromStart();
            }
        }

        if (horizontal !== undefined && this.horizontal !== horizontal) {
            this.horizontal = horizontal;
            this._updatePropertyKeys();

            if (this._scrollElement) {
                /* TODO: Needs testing */
                this._updateWidgetSize();
            }

            this.scrollTo(0);
        }

        Batch._end();
    }
}

export default List;
