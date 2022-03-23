import PubSub from "../PubSub";
import throttle from "utils/throttle";
import ResizeObserver from "models/ResizeObserver";
import { EVT_FROM, EVT_TO, EVT_SCROLL_SIZE } from "constants";

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

    _scrollPos = 0;
    _overscanCount = 0;
    _estimatedItemSize = 0;

    _zeroChildNode = null;
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

    _measureItemsThrottled = throttle(() => {
        /*
            Babel still transpiles optional chaining little ugly
        */
        let child =
            this._zeroChildNode && this._zeroChildNode.nextElementSibling;

        if (child) {
            let index = this.from,
                diff = 0,
                lim = index + 1,
                buff = 0;

            /* We can batch-update fenwick tree, if we know updated indexes range */
            for (; lim < this.to; lim += lim & -lim);

            do {
                diff = child[this._sizeKey] - this._itemSizes[index];

                if (diff) {
                    this._itemSizes[index] += diff;
                    buff += diff;
                    this._updateItemHeight(index + 1, diff, lim);
                }
            } while (++index < this.to && (child = child.nextElementSibling));

            if (buff !== 0) {
                this._startBatch();
                this._updateItemHeight(lim, buff, this._fTree.length);
                this._setScrollSize(this.scrollSize + buff);
                this._updateRangeFromEnd();
                this._endBatch();
            }
        }
    });

    constructor() {
        super();

        this.on(this._measureItemsThrottled, [EVT_FROM, EVT_TO]);
    }

    setWidgetSize(widgetSize) {
        if (widgetSize !== this._widgetSize) {
            this._widgetSize = widgetSize;
            this._updateRangeFromEnd();
        }
    }

    _itemCountChanged(itemCount) {
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
                .fill(this._estimatedItemSize, curRowHeighsLength)
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

        if (curScrollPos > this._scrollPos) {
            this._scrollPos = curScrollPos;
            this._updateRangeFromEnd();
        } else if (curScrollPos < this._scrollPos) {
            this._scrollPos = curScrollPos;
            this._updateRangeFromStart();
        }
    };

    _unobserveCurrentOuterNode() {
        if (this._outerNode) {
            this._OuterNodeResizeObserver.unobserve(this._outerNode);
            this._outerNode.removeEventListener("scroll", this._setScrollPos);
        }
    }

    /* will ne used as callback, so => */
    setOuterNode = node => {
        this._unobserveCurrentOuterNode();
        this._outerNode = node;
        if (node) {
            this._OuterNodeResizeObserver.observe(node);
            node.addEventListener("scroll", this._setScrollPos, {
                passive: true
            });
        }
    };

    /* will ne used as callback, so => */
    setZeroChildNode = node => {
        this._zeroChildNode = node;
        if (node) {
            this._measureItemsThrottled();
        }
    };

    _updateRangeFromEnd() {
        const to = Math.min(
            this.itemCount,
            1 + this.getIndex(this._scrollPos + this._widgetSize)
        );

        if (to > this.to) {
            this._startBatch();

            this.to = Math.min(this.itemCount, to + this._overscanCount);
            this._run(EVT_TO);

            const from = this.getIndex(this._scrollPos);

            if (from !== this.from) {
                this.from = from;
                this._run(EVT_FROM);
            }

            this._endBatch();
        }
    }

    _updateRangeFromStart() {
        const from = this.getIndex(this._scrollPos);

        if (from < this.from) {
            this._startBatch();

            this.from = Math.max(0, from - this._overscanCount);
            this._run(EVT_FROM);

            const to = Math.min(
                this.itemCount,
                1 + this.getIndex(this._scrollPos + this._widgetSize)
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

    _destroy() {
        this._unobserveCurrentOuterNode();
        this._measureItemsThrottled._cancel();
    }

    scrollTo(index) {
        if (this._outerNode) {
            this._outerNode[this._scrollKey] = this.getOffset(index);
        } else if (process.env.NODE_ENV !== "production") {
            console.error("outerNode is not set");
        }
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
                this._scrollPos = 0;
                this.setWidgetSize(this._outerNode[this._sizeKey]);
                this._updateRangeFromStart();
            }
            this._endBatch();
        }
    }

    setItemCount(itemCount) {
        if (itemCount !== this.itemCount) {
            this.itemCount = itemCount;
            this._startBatch();
            this._itemCountChanged(itemCount);
            if (this.to > itemCount) {
                this._shiftRangeToEnd();
            } else {
                this._updateRangeFromEnd();
            }
            this._measureItemsThrottled();
            this._endBatch();
        }
    }

    /*
        No need to waste extra render reacting on these props.
        Normally they should not be changed.
    */
    setSecondaryParams(estimatedItemSize, overscanCount) {
        this._estimatedItemSize = estimatedItemSize;
        this._overscanCount = overscanCount;
    }
}

export default List;
