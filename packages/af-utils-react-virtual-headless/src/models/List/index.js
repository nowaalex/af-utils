import PubSub from "../PubSub";
import getEstimatedItemSizeDefault from "utils/getEstimatedItemSize";
import ResizeObserver from "models/ResizeObserver";
import throttle from "/utils/throttle";
import {
    EVT_ALL,
    EVT_FROM,
    EVT_TO,
    EVT_SCROLL_SIZE,
    MEASUREMENTS_MAX_DELAY
} from "constants";

const HORIZONTAL_SCROLL_KEY = "scrollLeft";
const VERTICAL_SCROLL_KEY = "scrollTop";

const HORIZONTAL_SIZE_KEY = "offsetWidth";
const VERTICAL_SIZE_KEY = "offsetHeight";

class List extends PubSub {
    horizontal = false;
    _scrollKey = VERTICAL_SCROLL_KEY;
    _sizeKey = VERTICAL_SIZE_KEY;

    _OuterNodeResizeObserver = new ResizeObserver(() =>
        this.setWidgetSize(this._outerNode[this._sizeKey])
    );

    scrollPos = 0;
    _overscanCount = 0;

    _scrollToTmpValue = null;
    _scrollToTimer = 0;

    _outerNode = null;
    _widgetSize = 0;

    _itemSizes = [];
    _fTree = [];

    /*
        most significant bit of this.itemCount;
        caching it to avoid Math.clz32 calculations on every getIndex call
    */
    _msb = 0;

    scrollSize = 0;
    itemCount = 0;
    from = 0;
    to = 0;

    _elQueue = new Map();
    _elToIdx = new Map();
    _idxToEl = new Map();

    _ElResizeObserver = new ResizeObserver(entries => {
        let index = this.from,
            diff = 0,
            buff = 0,
            lim = index + 1;

        for (; lim < this.to; lim += lim & -lim);

        for (const { target } of entries) {
            index = this._elToIdx.get(target);
            diff = target[this._sizeKey] - this._itemSizes[index];

            if (diff) {
                this._itemSizes[index] += diff;
                buff += diff;
                this._updateItemHeight(index + 1, diff, lim);
            }
        }

        if (buff !== 0) {
            this._startBatch();
            this._updateItemHeight(lim, buff, this._fTree.length);
            this._setScrollSize(this.scrollSize + buff);
            this._updateRangeFromEnd();
            this._endBatch();
        }
    });

    setWidgetSize(widgetSize) {
        if (widgetSize !== this._widgetSize) {
            this._widgetSize = widgetSize;
            this._updateRangeFromEnd();
        }
    }

    _itemCountChanged(itemCount, getEstimatedItemSize) {
        if (itemCount < 0 || itemCount > 0x7fffffff) {
            /*
                0x7fffffff - maximum 32bit integer.
                Bitwise operations, used in fenwick tree, cannot be applied to numbers > int32.
            */
            throw new Error(
                `itemCount must be 0 - 2_147_483_647. Got: ${itemCount}.`
            );
        }

        this._msb = itemCount && 1 << (31 - Math.clz32(itemCount));

        const oldItemSizes = this._itemSizes;
        const curRowHeighsLength = oldItemSizes.length;

        if (itemCount > curRowHeighsLength) {
            this._itemSizes = new Uint32Array(itemCount);
            this._fTree = new Uint32Array(itemCount + 1);

            this._itemSizes
                .fill(
                    getEstimatedItemSize(
                        oldItemSizes,
                        this.scrollSize,
                        itemCount
                    ),
                    curRowHeighsLength
                )
                .set(oldItemSizes);

            /* 
                Creating fenwick tree from an array in linear time;
                It is much more efficient, than calling updateItemHeight N times.
            */

            this._fTree.set(this._itemSizes, 1);

            for (let i = 1, j; i <= itemCount; i++) {
                j = i + (i & -i);
                if (j <= itemCount) {
                    this._fTree[j] += this._fTree[i];
                }
            }
        }

        this._setScrollSize(this.getOffset(itemCount));
    }

    getIndex(offset) {
        let index = 0;

        for (
            let bitMask = this._msb, tempIndex = 0;
            bitMask > 0;
            bitMask >>= 1
        ) {
            tempIndex = index + bitMask;
            if (tempIndex <= this.itemCount) {
                if (offset === this._fTree[tempIndex]) {
                    return tempIndex;
                }
                if (offset > this._fTree[tempIndex]) {
                    offset -= this._fTree[tempIndex];
                    index = tempIndex;
                }
            }
        }

        return index;
    }

    getOffset(index) {
        if (process.env.NODE_ENV !== "production") {
            if (index > this.itemCount) {
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

    /* i starts from 1 here; */
    _updateItemHeight(i, delta, limitTreeLiftingIndex) {
        for (; i < limitTreeLiftingIndex; i += i & -i) {
            this._fTree[i] += delta;
        }
    }

    _setScrollPos = () => {
        const curScrollPos = this._outerNode[this._scrollKey];
        if (curScrollPos > this.scrollPos) {
            this.scrollPos = curScrollPos;
            this._updateRangeFromEnd();
        } else if (curScrollPos < this.scrollPos) {
            this.scrollPos = curScrollPos;
            this._updateRangeFromStart();
        }
    };

    _processQueueThrottled = throttle(() => {
        for (const [i, el] of this._elQueue) {
            this._idxToEl.set(i, el);
            this._elToIdx.set(el, i);
            this._ElResizeObserver.observe(el);
        }
        this._elQueue.clear();
    });

    /*
        Performs as destructor when null is passed
        will ne used as callback, so using =>
    */
    setOuterNode = node => {
        if (this._outerNode) {
            this._OuterNodeResizeObserver.unobserve(this._outerNode);
            this._outerNode.removeEventListener("scroll", this._setScrollPos);
        }

        this._outerNode = node;

        if (node) {
            this._OuterNodeResizeObserver.observe(node);
            node.addEventListener("scroll", this._setScrollPos, {
                passive: true
            });
        } else {
            this._ElResizeObserver.disconnect();
            clearTimeout(this._scrollToTimer);
            this._processQueueThrottled._cancel();
        }
    };

    el(i, node) {
        if (node) {
            this._elQueue.set(i, node);
            this._processQueueThrottled();
        } else if (!this._elQueue.delete(i)) {
            node = this._idxToEl.get(i);
            this._idxToEl.delete(i);
            this._elToIdx.delete(node);
            this._ElResizeObserver.unobserve(node);
        }
    }

    _updateRangeFromEnd() {
        const to = Math.min(
            this.itemCount,
            1 + this.getIndex(this.scrollPos + this._widgetSize)
        );

        if (to > this.to) {
            this._startBatch();

            this.to = Math.min(this.itemCount, to + this._overscanCount);
            this._run(EVT_TO);

            const from = this.getIndex(this.scrollPos);

            if (from !== this.from) {
                this.from = from;
                this._run(EVT_FROM);
            }

            this._endBatch();
        }
    }

    _updateRangeFromStart() {
        const from = this.getIndex(this.scrollPos);

        if (from < this.from) {
            this._startBatch();

            this.from = Math.max(0, from - this._overscanCount);
            this._run(EVT_FROM);

            const to = Math.min(
                this.itemCount,
                1 + this.getIndex(this.scrollPos + this._widgetSize)
            );

            if (to !== this.to) {
                this.to = to;
                this._run(EVT_TO);
            }

            this._endBatch();
        }
    }

    _shiftRangeToEnd() {
        this.to = this.itemCount;
        this._run(EVT_TO);

        const from = this.getIndex(
            Math.max(0, this.scrollSize - this._widgetSize)
        );

        if (from !== this.from) {
            this.from = from;
            this._run(EVT_FROM);
        }
    }

    _scrollToRaw = () => {
        if (this._outerNode) {
            this._outerNode[this._scrollKey] =
                this.getOffset(this._scrollToTmpValue[0]) +
                this._scrollToTmpValue[1];
        } else if (process.env.NODE_ENV !== "production") {
            console.error("outerNode is not set");
        }
    };

    scrollTo(index, pixelOffset) {
        if (!this._scrollToTmpValue) {
            this.on(this._scrollToRaw, EVT_ALL);
            this._scrollToTimer = setTimeout(() => {
                this.off(this._scrollToRaw, EVT_ALL);
                this._scrollToTmpValue = null;
            }, MEASUREMENTS_MAX_DELAY);
        }
        this._scrollToTmpValue = [index || 0, pixelOffset || 0];
        this._scrollToRaw();
    }

    _setScrollSize(v) {
        if (this.scrollSize !== v) {
            this.scrollSize = v;
            this._run(EVT_SCROLL_SIZE);
        }
    }

    setHorizontal(horizontal) {
        if (horizontal !== this.horizontal) {
            this._startBatch();
            this.horizontal = horizontal;
            this._scrollKey = horizontal
                ? HORIZONTAL_SCROLL_KEY
                : VERTICAL_SCROLL_KEY;
            this._sizeKey = horizontal
                ? HORIZONTAL_SIZE_KEY
                : VERTICAL_SIZE_KEY;
            if (this._outerNode) {
                /* TODO: Needs testing */
                this.scrollPos = 0;
                this.setWidgetSize(this._outerNode[this._sizeKey]);
                this._updateRangeFromStart();
            }
            this._endBatch();
        }
    }

    setItemCount(
        itemCount,
        getEstimatedItemSize = getEstimatedItemSizeDefault
    ) {
        if (itemCount !== this.itemCount) {
            this.itemCount = itemCount;
            this._startBatch();
            this._itemCountChanged(itemCount, getEstimatedItemSize);
            if (this.to > itemCount) {
                this._shiftRangeToEnd();
            } else {
                this._updateRangeFromEnd();
            }
            this._endBatch();
        }
    }

    setOverscan(overscanCount) {
        this._overscanCount = overscanCount;
    }
}

export default List;
