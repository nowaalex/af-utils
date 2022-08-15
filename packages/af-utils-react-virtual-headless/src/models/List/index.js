import {
    SIZES_HASH_MODULO,
    EVT_ALL,
    EVT_RANGE,
    EVT_SIZES,
    EVT_SCROLL_SIZE,
    MAX_ITEM_COUNT,
    DEFAULT_ESTIMATED_ITEM_SIZE,
    DEFAULT_OVERSCAN_COUNT,
    DEFAULT_ESTIMATED_WIDGET_SIZE
} from "constants";

import call from "/utils/call";

import Batch from "/singletons/Batch";

const HORIZONTAL_SCROLL_KEY = "scrollLeft";
const VERTICAL_SCROLL_KEY = "scrollTop";

const HORIZONTAL_SCROLL_TO_KEY = "left";
const VERTICAL_SCROLL_TO_KEY = "top";

const HORIZONTAL_SIZE_KEY = "offsetWidth";
const VERTICAL_SIZE_KEY = "offsetHeight";

const TypedCache = Uint32Array;

const ITEMS_ROOM = 32;

/*
    Chrome works ok with 0;
    FF needs some timer to place scrollTo call after ResizeObserver callback
*/
const NON_SMOOTH_SCROLL_CHECK_TIMER = 32;

const SMOOTH_SCROLL_CHECK_TIMER = 512;

/*
    How many milliseconds without scroll events must pass before scroll considered ended
*/
const SCROLL_ENDED_TIMER = 128;

const FinalResizeObserver = process.env.__IS_SERVER__
    ? class {
          observe() {}
          unobserve() {}
          disconnect() {}
      }
    : ResizeObserver;

/* 
    Creating fenwick tree from an array in linear time;
    It is much more efficient, than calling updateItemHeight N times.
*/

const EMPTY_TYPED_ARRAY = new TypedCache(0);

const buildFtree = sourceArray => {
    const fTreeLength = sourceArray.length + 1;
    const fTree = new TypedCache(fTreeLength);

    fTree.set(sourceArray, 1);

    for (let i = 1, j; i < fTreeLength; i++) {
        j = i + (i & -i);
        if (j < fTreeLength) {
            fTree[j] += fTree[i];
        }
    }

    return fTree;
};

const updateItemHeight = (fTree, i, delta, limitTreeLiftingIndex) => {
    for (; i < limitTreeLiftingIndex; i += i & -i) {
        fTree[i] += delta;
    }
};

class List {
    horizontal = false;
    _scrollToKey = VERTICAL_SCROLL_TO_KEY;
    _scrollKey = VERTICAL_SCROLL_KEY;
    _sizeKey = VERTICAL_SIZE_KEY;

    _itemCount = 0;
    _scrollTs = 0;
    _scrollToTimer = 0;
    _scrollPos = 0;
    _overscanCount = DEFAULT_OVERSCAN_COUNT;

    _outerNode = null;

    _itemSizes = EMPTY_TYPED_ARRAY;
    _fTree = EMPTY_TYPED_ARRAY;

    /*
        most significant bit of this._itemCount;
        caching it to avoid Math.clz32 calculations on every getIndex call
    */
    _msb = 0;

    scrollSize = 0;
    from = 0;
    to = 0;
    sizesHash = 0;

    _elToIdx = new Map();
    _idxToEl = new Map();

    _ElResizeObserver = new FinalResizeObserver(entries => {
        let index = 0,
            diff = 0,
            buff = 0,
            wasAtLeastOneSizeChanged = false,
            lim = this.from + 1;

        for (; lim < this.to; lim += lim & -lim);
        lim = Math.min(lim, this._fTree.length);

        for (const { target } of entries) {
            index = this._elToIdx.get(target);

            /*
                ResizeObserver may give us elements, which are not in visible range => will be unmounted soon.
                Should not take them into account.
                This is done for performance + updateItemHeight hack would not work without it
            */
            if (index >= this.from && index < this.to) {
                diff = target[this._sizeKey] - this._itemSizes[index];
                if (diff) {
                    wasAtLeastOneSizeChanged = true;
                    this._itemSizes[index] += diff;
                    buff += diff;
                    updateItemHeight(this._fTree, index + 1, diff, lim);
                }
            }
        }

        if (wasAtLeastOneSizeChanged) {
            Batch._start();

            if (buff !== 0) {
                updateItemHeight(this._fTree, lim, buff, this._fTree.length);
                this.scrollSize += buff;
                this._run(EVT_SCROLL_SIZE);
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
            this._run(EVT_SIZES);

            Batch._end();
        }
    });

    _EventsList = EVT_ALL.map(() => []);

    _updateWidgetSize = () => {
        const widgetSize = this._outerNode[this._sizeKey];
        if (widgetSize !== this._widgetSize) {
            this._widgetSize = widgetSize;
            this._updateRangeFromEnd();
        }
    };

    _OuterNodeResizeObserver = new FinalResizeObserver(this._updateWidgetSize);

    constructor(estimatedWidgetSize) {
        this._widgetSize = estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE;
    }

    on(callBack, deps) {
        deps.forEach(evt => this._EventsList[evt].push(callBack));
        return () =>
            deps.forEach(evt =>
                this._EventsList[evt].splice(
                    this._EventsList[evt].indexOf(callBack),
                    1
                )
            );
    }

    _run(evt) {
        this._EventsList[evt].forEach(Batch._level === 0 ? call : Batch._queue);
    }

    getIndex(offset) {
        let index = 0;
        offset = Math.min(offset, this.scrollSize);
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

    getOffset(index) {
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

    getSize(itemIndex) {
        if (process.env.NODE_ENV !== "production") {
            if (itemIndex >= this._itemSizes.length) {
                throw new Error("itemIndex must be < itemCount in getSize");
            }
        }
        return this._itemSizes[itemIndex];
    }

    get visibleFrom() {
        const firstVisibleIndex = this.getIndex(this._scrollPos);
        return (
            firstVisibleIndex +
            (this._scrollPos - this.getOffset(firstVisibleIndex)) /
                this._itemSizes[firstVisibleIndex]
        );
    }

    _updateScrollPos = e => {
        const curScrollPos = this._scrollPos,
            newScrollPos = this._outerNode[this._scrollKey];

        if (newScrollPos !== curScrollPos) {
            this._scrollPos = newScrollPos;
            this._scrollTs = e.timeStamp;

            if (newScrollPos > curScrollPos) {
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
    setOuterNode = node => {
        if (this._outerNode) {
            this._OuterNodeResizeObserver.unobserve(this._outerNode);
            this._outerNode.removeEventListener(
                "scroll",
                this._updateScrollPos
            );
        }

        if ((this._outerNode = node)) {
            this._OuterNodeResizeObserver.observe(node);
            node.addEventListener("scroll", this._updateScrollPos, {
                passive: true
            });
        } else {
            this._ElResizeObserver.disconnect();
            clearTimeout(this._scrollToTimer);
        }
    };

    el(i, node) {
        if (node) {
            this._elToIdx.set(node, i);
            this._idxToEl.set(i, node);
            this._ElResizeObserver.observe(node);
        } else {
            node = this._idxToEl.get(i);
            if (node) {
                this._idxToEl.delete(i);
                this._elToIdx.delete(node);
                this._ElResizeObserver.unobserve(node);
            }
        }
    }

    _updateRangeFromEnd() {
        /*
            zero itemCount check is not needed here, it is done inside folowing if block
        */
        const to = 1 + this.getIndex(this._scrollPos + this._widgetSize);

        if (to > this.to) {
            this.to = Math.min(this._itemCount, to + this._overscanCount);
            this.from = this.getIndex(this._scrollPos);
            this._run(EVT_RANGE);
        }
    }

    _updateRangeFromStart() {
        const from = this.getIndex(this._scrollPos);

        if (from < this.from) {
            this.from = Math.max(0, from - this._overscanCount);
            this.to =
                this._itemCount &&
                1 + this.getIndex(this._scrollPos + this._widgetSize);

            this._run(EVT_RANGE);
        }
    }

    scrollTo(index, smooth, attemptsLeft) {
        clearTimeout(this._scrollToTimer);

        if (this._outerNode) {
            const whole = index | 0;
            const desiredScrollPos = Math.min(
                this.scrollSize - this._widgetSize,
                this.getOffset(whole) +
                    Math.round(this._itemSizes[whole] * (index - whole))
            );

            if (desiredScrollPos !== this._scrollPos) {
                attemptsLeft ||= 5;
                if (
                    !smooth ||
                    performance.now() - this._scrollTs > SCROLL_ENDED_TIMER
                ) {
                    this._outerNode.scroll({
                        [this._scrollToKey]: desiredScrollPos,
                        behavior: smooth ? "smooth" : "instant"
                    });
                    attemptsLeft--;
                }
                if (attemptsLeft) {
                    this._scrollToTimer = setTimeout(
                        () => this.scrollTo(index, smooth, attemptsLeft),
                        smooth
                            ? SMOOTH_SCROLL_CHECK_TIMER
                            : NON_SMOOTH_SCROLL_CHECK_TIMER
                    );
                }
            }
        }
    }

    setHorizontal(horizontal) {
        if (horizontal !== this.horizontal) {
            this._scrollToKey = (this.horizontal = horizontal)
                ? HORIZONTAL_SCROLL_TO_KEY
                : VERTICAL_SCROLL_TO_KEY;
            this._scrollKey = horizontal
                ? HORIZONTAL_SCROLL_KEY
                : VERTICAL_SCROLL_KEY;
            this._sizeKey = horizontal
                ? HORIZONTAL_SIZE_KEY
                : VERTICAL_SIZE_KEY;

            if (this._outerNode) {
                /* TODO: Needs testing */
                this._updateWidgetSize();
            }

            this.scrollTo(0);
        }
    }

    setItemCount(itemCount, estimatedItemSize) {
        if (itemCount > MAX_ITEM_COUNT) {
            throw new Error(
                `itemCount must be <= ${MAX_ITEM_COUNT}. Got: ${itemCount}.`
            );
        }
        if (itemCount !== this._itemCount) {
            this._msb =
                (this._itemCount = itemCount) &&
                1 << (31 - Math.clz32(itemCount));

            const oldItemSizes = this._itemSizes;
            const curRowHeighsLength = oldItemSizes.length;

            if (itemCount > curRowHeighsLength) {
                this._itemSizes = new TypedCache(
                    Math.min(itemCount + ITEMS_ROOM, MAX_ITEM_COUNT)
                );
                this._itemSizes.set(oldItemSizes);

                this._fTree = /*@__NOINLINE__*/ buildFtree(
                    this._itemSizes.fill(
                        estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE,
                        curRowHeighsLength
                    )
                );
            }

            Batch._start();

            this.scrollSize = this.getOffset(itemCount);
            this._run(EVT_SCROLL_SIZE);

            if (this.to > itemCount) {
                // Forcing shift range to end
                this.to = -1;
            }

            this._updateRangeFromEnd();
            Batch._end();
        }
    }

    setOverscan(overscanCount) {
        this._overscanCount = overscanCount;
    }
}

export default List;
