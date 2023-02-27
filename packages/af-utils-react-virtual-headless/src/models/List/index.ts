import {
    SIZES_HASH_MODULO,
    Event,
    ScrollElementSizeKey,
    ItemSizeKey,
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
import { build, update, getLiftingLimit } from "utils/fTree";
import getDistanceBetween from "utils/getDistanceBetween";
import Batch from "singletons/Batch";
import { ListInitialParams, ListRuntimeParams } from "./types";

type ScrollElement = HTMLElement & Window;

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

const ItemSizeKeysOrdered = [ItemSizeKey.VERTICAL, ItemSizeKey.HORIZONTAL];

const ScrollToKeysOrdered = [ScrollToKey.VERTICAL, ScrollToKey.HORIZONTAL];
class List {
    private _scrollElementSizeKey: ScrollElementSizeKey =
        ScrollElementSizeKeysOrdered[0];
    private _scrollKey: ScrollKey = ScrollKeysOrdered[0];
    private _sizeKey: ItemSizeKey = ItemSizeKeysOrdered[0];
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
    private _scrollElementOffset = 0;

    /*
        scrollElement[ scroll[ Top | Left ] ] - _scrollElementOffset

        getIndex, getOffset and some other methods are designed to be pure
        and they don't know about _scrollElementOffset,
        so it useful to store cached value for them
    */
    private _alignedScrollPos = 0;

    private _rawScrollSize = 0;
    private _stickyOffset = 0;
    private _itemCount = 0;
    private _availableWidgetSize = 0;
    private _scrollToTimer = 0;
    private _overscanCount = DEFAULT_OVERSCAN_COUNT;
    private _estimatedItemSize = DEFAULT_ESTIMATED_ITEM_SIZE;

    private _scrollElement: ScrollElement | null = null;
    private _initialElement: HTMLElement | null = null;

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

    private _elToIdx = new Map<HTMLElement, number>();
    private _idxToEl = new Map<number, HTMLElement>();

    /* header and footer; lengths are hardcoded */
    private _stickyElements: [HTMLElement | null, HTMLElement | null] = [
        null,
        null
    ];
    private _stickyElementsSizes: [number, number] = [0, 0];

    private _StickyElResizeObserver = new FinalResizeObserver(
        (entries: ResizeObserverEntry[]) => {
            let index = 0,
                diff = 0,
                buff = 0;

            for (const entry of entries) {
                const target = entry.target as HTMLElement;
                index = this._stickyElements.indexOf(target);
                if (index !== -1) {
                    diff =
                        target[this._sizeKey] -
                        this._stickyElementsSizes[index];
                    if (diff) {
                        this._stickyElementsSizes[index] += diff;
                        buff += diff;
                    }
                }
            }

            this._updateStickyOffset(buff);
        }
    );

    private _ElResizeObserver = new FinalResizeObserver(
        (entries: ResizeObserverEntry[]) => {
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
            for (const entry of entries) {
                const target = entry.target as HTMLElement;

                // cannot be undefined, because element is being added to this map before getting into ResizeObserver
                index = this._elToIdx.get(target) as number;

                /*
                ResizeObserver may give us elements, which are not in visible range => will be unmounted soon.
                Should not take them into account.
                This is done for performance + updateItemHeight hack would not work without it
            */
                if (index < lim) {
                    diff = target[this._sizeKey] - this._itemSizes[index];
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
        }
    );

    private _EventsList: Array<Array<() => void>> = EVT_ALL.map(() => []);

    private _updateWidgetSize = () => {
        // all null checks are already done
        const scrollEl = this._scrollElement as ScrollElement;
        const availableWidgetSize =
            scrollEl[this._scrollElementSizeKey] - this._stickyOffset;

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

    private _ScrollElementResizeObserver = new FinalResizeObserver(
        this._updateWidgetSize
    );

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

    /*
        "scroll" is the only event here, so switch/case is not needed.
    */
    handleEvent() {
        // scrollEl may not be null here, because handleEvent is attached directly to it.
        const scrollEl = this._scrollElement as ScrollElement;
        const curScrollPos = this._alignedScrollPos,
            newScrollPos =
                scrollEl[this._scrollKey] - this._scrollElementOffset;

        if (newScrollPos !== curScrollPos) {
            if ((this._alignedScrollPos = newScrollPos) > curScrollPos) {
                this._updateRangeFromEnd();
            } else {
                this._updateRangeFromStart();
            }
        }
    }

    /*
        Performs as destructor when null is passed
        will ne used as callback, so using =>
    */
    setScrollElement = (element: ScrollElement | null) => {
        this._ScrollElementResizeObserver.disconnect();
        window.removeEventListener("resize", this._updateWidgetSize);

        if (this._scrollElement) {
            this._scrollElement.removeEventListener("scroll", this);
        }

        if ((this._scrollElement = element)) {
            if (element instanceof Window) {
                window.addEventListener("resize", this._updateWidgetSize);
            } else {
                this._ScrollElementResizeObserver.observe(element);
            }
            element.addEventListener("scroll", this, {
                passive: true
            });
            this._updatePropertyKeys();
            this.recalculateOffset();
        } else {
            this._ElResizeObserver.disconnect();
            this._StickyElResizeObserver.disconnect();
            clearTimeout(this._scrollToTimer);
        }
    };

    setInitialElement = (element: HTMLElement | null) => {
        this._initialElement = element;
        this.recalculateOffset();
    };

    recalculateOffset() {
        const newScrollElementOffset = /*@__NOINLINE__*/ getDistanceBetween(
            this._scrollElement,
            this._initialElement,
            this._scrollElementOffset + this._alignedScrollPos,
            this._scrollToKey
        );
        const diff = newScrollElementOffset - this._scrollElementOffset;

        if (diff) {
            this._alignedScrollPos -= diff;
            this._scrollElementOffset += diff;
            this._updateRangeFromEnd();
        }
    }

    el(i: number, node: HTMLElement) {
        const oldNode = this._idxToEl.get(i);

        if (oldNode) {
            this._idxToEl.delete(i);
            this._elToIdx.delete(oldNode);
            this._ElResizeObserver.unobserve(oldNode);
        }

        if (node) {
            this._elToIdx.set(node, i);
            this._idxToEl.set(i, node);
            this._ElResizeObserver.observe(node);
        }
    }

    private _stickyEl(i: number, node: HTMLElement) {
        const oldNode = this._stickyElements[i];

        if (oldNode) {
            this._StickyElResizeObserver.unobserve(oldNode);
            this._updateStickyOffset(-this._stickyElementsSizes[i]);
            this._stickyElements[i] = null;
            this._stickyElementsSizes[i] = 0;
        }

        if (node) {
            this._StickyElResizeObserver.observe(
                (this._stickyElements[i] = node)
            );
        }
    }

    setStickyHeader(node: HTMLElement) {
        this._stickyEl(STICKY_HEADER_INDEX, node);
    }

    setStickyFooter(node: HTMLElement) {
        this._stickyEl(STICKY_FOOTER_INDEX, node);
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

    private _updateRangeFromEnd() {
        const to = this._exactTo;

        if (to > this.to) {
            this.to = Math.min(this._itemCount, to + this._overscanCount);
            this.from = this._exactFrom;
            this._run(Event.RANGE);
        }
    }

    private _updateRangeFromStart() {
        const from = this._exactFrom;

        if (from < this.from) {
            this.from = Math.max(0, from - this._overscanCount);
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
                behavior: smooth ? "smooth" : "auto"
            });

            this._scrollToTimer = window.setTimeout(
                () => this.scrollTo(index, smooth, attemptsLeft),
                smooth
                    ? SMOOTH_SCROLL_CHECK_TIMER
                    : NON_SMOOTH_SCROLL_CHECK_TIMER
            );
        }
    }

    _updatePropertyKeys() {
        const h = this.horizontal ? 1 : 0;
        const w = this._scrollElement instanceof Window ? 1 : 0;
        const i = h + 2 * w;

        this._scrollElementSizeKey = ScrollElementSizeKeysOrdered[i];
        this._scrollKey = ScrollKeysOrdered[i];
        this._sizeKey = ItemSizeKeysOrdered[h];
        this._scrollToKey = ScrollToKeysOrdered[h];
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
                // Forcing shift range to end
                this.to = -1;
            }

            this._updateRangeFromEnd();
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
