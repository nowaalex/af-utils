import { assert } from "#virtual-errors";
import {
    MAX_SIZE_INDEX_CAPACITY,
    MIN_SIZE_INDEX_CAPACITY,
    SIZE_INDEX_GROWTH_DENOMINATOR,
    SIZE_INDEX_GROWTH_NUMERATOR
} from "../../constants";
import { VirtualScrollerErrorIndex } from "../../errors/codes";
import { getLiftingLimit, syncWithArray, update } from "../../utils/fTree";

/** Shared zero-allocation backing store used before the first capacity growth. */
const EMPTY_SIZES = new Float64Array(0);

/** Grow a fixed-length numeric store while preserving its contents. */
const growFloat64Array = (array: Float64Array<ArrayBuffer>, length: number) => {
    // TODO: Think about ArrayBuffer.resize().
    // Every empty SizeIndex store shares this view; transferring it would detach all of them.
    if (array === EMPTY_SIZES) return new Float64Array(length);

    return new Float64Array(
        array.buffer.transferToFixedLength(
            length * Float64Array.BYTES_PER_ELEMENT
        )
    );
};

/**
 * Validate an item count before it is used to allocate typed arrays.
 *
 * @param count - Requested logical item count.
 * @throws {@link VirtualScrollerError} with `AFV_INVALID_ITEM_COUNT` if
 * `count` is not a non-negative safe integer or exceeds the capacity limit.
 * @internal
 */
export const assertSizeIndexCount = (count: number) => {
    assert(
        Number.isSafeInteger(count) &&
            count >= 0 &&
            count <= MAX_SIZE_INDEX_CAPACITY,
        VirtualScrollerErrorIndex.INVALID_ITEM_COUNT,
        count,
        MAX_SIZE_INDEX_CAPACITY
    );
};

/**
 * Validate an estimated item size independently of `SizeIndex` instance state.
 *
 * @param size - Candidate estimated item size.
 * @throws {@link VirtualScrollerError} with `AFV_INVALID_ITEM_SIZE` if `size`
 * is not finite and strictly positive.
 * @internal
 */
export const assertEstimatedSize = (size: number) => {
    assert(
        Number.isFinite(size) && size > 0,
        VirtualScrollerErrorIndex.INVALID_ITEM_SIZE,
        size
    );
};

/**
 * Select the next typed-array capacity for a growing {@link SizeIndex}.
 *
 * @remarks
 * Capacity grows geometrically by the documented 3/2 factor, but a large jump
 * is allocated in one step. Existing capacity is never reduced, which keeps
 * append-heavy workloads from repeatedly allocating and copying arrays.
 *
 * @param currentCapacity - Currently allocated number of item slots.
 * @param requiredCapacity - Minimum number of slots required by the caller.
 * @returns `currentCapacity` when it is already sufficient; otherwise the
 * bounded geometric capacity.
 * @internal
 */
export const getNextSizeIndexCapacity = (
    currentCapacity: number,
    requiredCapacity: number
) => {
    if (requiredCapacity <= currentCapacity) {
        return currentCapacity;
    }

    const geometricCapacity = Math.max(
        MIN_SIZE_INDEX_CAPACITY,
        Math.ceil(
            (currentCapacity * SIZE_INDEX_GROWTH_NUMERATOR) /
                SIZE_INDEX_GROWTH_DENOMINATOR
        )
    );

    return Math.min(
        MAX_SIZE_INDEX_CAPACITY,
        Math.max(requiredCapacity, geometricCapacity)
    );
};

/**
 * Dense item-size storage with Fenwick-tree prefix sums.
 *
 * @remarks
 * The dense `Float64Array` keeps `getSize` at `O(1)`. A Fenwick tree over the
 * same values provides `getOffset`, `getIndex` and individual size updates in
 * `O(log n)`. Unmeasured and invalidated slots store the current estimate
 * directly, so no parallel measurement-state allocation is required.
 *
 * Capacity only grows, while `count` is the logical boundary. Keeping all
 * numeric storage in typed arrays and keeping this class free of DOM and event
 * dependencies gives its hot paths stable, monomorphic inputs.
 *
 * Multiple measurements should be applied as one batch: obtain an exclusive
 * lifting boundary with {@link SizeIndex._getUpdateLimit}, call
 * {@link SizeIndex._updateSize} for every item, sum the returned deltas, and
 * finish with {@link SizeIndex._completeUpdateBatch}. This updates the common
 * Fenwick ancestors once rather than once per item.
 *
 * @internal
 */
class SizeIndex {
    /** Logical number of addressable items. */
    _count = 0;

    /** Number of allocated slots shared by all typed-array backing stores. */
    _capacity = 0;

    /** Highest power-of-two bit used to lift Fenwick-tree index searches. */
    private _mostSignificantBit = 0;

    /** Size assigned to new or explicitly invalidated item slots. */
    _estimatedSize: number;

    /** Cached prefix sum for the complete logical range `[0, count)`. */
    _totalSize = 0.0;

    /**
     * Dense effective sizes, including estimates for invalidated item slots.
     *
     * TODO: Benchmark and document the practical memory limit of the two dense
     * Float64 stores, and re-evaluate precision against a chunked or sparse
     * representation before changing the documented numeric limit.
     */
    private _sizes = EMPTY_SIZES;

    /** Fenwick tree over `_sizes`, stored with a one-based root convention. */
    private _tree = EMPTY_SIZES;

    /**
     * Create an empty size index.
     *
     * @param estimatedSize - Initial positive finite size for every item slot.
     */
    constructor(estimatedSize: number) {
        assertEstimatedSize(estimatedSize);
        this._estimatedSize = estimatedSize;
    }

    /**
     * Replace the estimate while preserving a half-open cached-size range.
     *
     * @param estimatedSize - New positive finite estimate.
     * @param preserveFrom - First cached-size index to retain.
     * @param preserveTo - Exclusive cached-size boundary to retain.
     * @returns The observable size-state change and total-size delta.
     */
    _setEstimatedSize(estimatedSize: number, preserveFrom = 0, preserveTo = 0) {
        assertEstimatedSize(estimatedSize);

        if (estimatedSize === this._estimatedSize) {
            return { changed: false, totalDelta: 0.0 } as const;
        }

        const oldTotalSize = this._totalSize;
        let changed = false;
        for (let index = 0; index < preserveFrom; index++) {
            if (this._sizes[index] !== estimatedSize) {
                changed = true;
                break;
            }
        }
        for (let index = preserveTo; !changed && index < this._count; index++) {
            if (this._sizes[index] !== estimatedSize) {
                changed = true;
                break;
            }
        }

        this._estimatedSize = estimatedSize;
        this._sizes.fill(estimatedSize, 0, preserveFrom);
        this._sizes.fill(estimatedSize, preserveTo);

        if (this._capacity > 0) {
            syncWithArray(this._tree, this._sizes);
        }
        this._totalSize = this._getOffset(this._count);
        return {
            changed,
            totalDelta: this._totalSize - oldTotalSize
        } as const;
    }

    /**
     * Change the logical item count without shrinking allocated storage.
     *
     * @param count - New logical item count.
     * @returns `true` when the logical count changed, otherwise `false`.
     * @remarks Allocated capacity is retained, but cached sizes removed by a
     * shrink are reset so a later grow cannot reuse values for different data.
     */
    _setCount(count: number) {
        assertSizeIndexCount(count);

        if (count === this._count) {
            return false;
        }

        this._ensureCapacity(count);
        if (count < this._count) {
            this._sizes.fill(this._estimatedSize, count, this._count);
            syncWithArray(this._tree, this._sizes);
        }
        this._count = count;
        this._mostSignificantBit =
            count === 0 ? 0 : 1 << (31 - Math.clz32(count));
        this._totalSize = this._getOffset(count);
        return true;
    }

    /**
     * Reset cached sizes in a logical half-open range to the current estimate.
     *
     * @returns Whether any effective size changed and the total-size delta.
     */
    _invalidateSizes(from: number, to: number) {
        let changed = false;
        let totalDelta = 0.0;
        const updateLimit = this._getUpdateLimit(from, to);

        for (let index = from; index < to; index++) {
            if (this._sizes[index] !== this._estimatedSize) {
                changed = true;
                const delta = this._estimatedSize - this._sizes[index];
                this._sizes[index] = this._estimatedSize;
                if (delta !== 0.0) {
                    totalDelta += delta;
                    update(this._tree, index + 1, delta, updateLimit);
                }
            }
        }

        if (totalDelta !== 0.0) {
            update(this._tree, updateLimit, totalDelta, this._tree.length);
            this._totalSize += totalDelta;
        }

        return { changed, totalDelta } as const;
    }

    /**
     * Apply an index-based collection splice while preserving retained sizes.
     *
     * @remarks This is deliberately `O(capacity)`: data mutations are cold,
     * while prefix queries and item measurements remain the optimized paths.
     */
    _splice(start: number, deleteCount: number, insertCount: number) {
        const oldCount = this._count;
        const nextCount = oldCount - deleteCount + insertCount;
        const oldTotalSize = this._totalSize;
        let sizesChanged = false;
        for (let index = start; index < oldCount; index++) {
            if (this._sizes[index] !== this._estimatedSize) {
                sizesChanged = true;
                break;
            }
        }
        this._ensureCapacity(nextCount);

        const tailStart = start + deleteCount;
        const tailTarget = start + insertCount;
        this._sizes.copyWithin(tailTarget, tailStart, oldCount);
        this._sizes.fill(this._estimatedSize, start, tailTarget);

        if (nextCount < oldCount) {
            this._sizes.fill(this._estimatedSize, nextCount, oldCount);
        }

        this._count = nextCount;
        this._mostSignificantBit =
            nextCount === 0 ? 0 : 1 << (31 - Math.clz32(nextCount));
        syncWithArray(this._tree, this._sizes);
        this._totalSize = this._getOffset(nextCount);

        return {
            sizesChanged,
            totalDelta: this._totalSize - oldTotalSize
        } as const;
    }

    /**
     * Read the cached size of an item in `O(1)`.
     *
     * @param index - Item index in the logical range `[0, count)`.
     */
    _getSize(index: number) {
        return this._sizes[index];
    }

    /**
     * Sum item sizes in the half-open range `[0, index)` in `O(log n)`.
     *
     * @param index - Exclusive item boundary in `[0, count]`.
     * @returns Pixel offset of that boundary.
     */
    // check-hot: SizeIndex._getOffset
    _getOffset(index: number) {
        let result = 0.0;

        for (; index > 0; index -= index & -index) {
            result += this._tree[index];
        }

        return result;
    }

    /**
     * Locate the item containing an offset in `O(log n)`.
     *
     * @param offset - Offset within the complete item-size range.
     * @returns An index in `[0, count)`. Non-positive offsets resolve to the
     * first item and offsets at or beyond `totalSize` resolve to the last item.
     * @remarks `count` must be greater than zero. Exact item-end boundaries
     * belong to the preceding item, matching the model's existing scroll
     * position semantics.
     */
    // check-hot: SizeIndex._getIndex
    _getIndex(offset: number) {
        // Stryker disable next-line all: The Fenwick search also returns zero here; this is a performance fast path.
        if (offset <= 0.0) {
            return 0;
        }

        // Stryker disable next-line EqualityOperator: At exactly totalSize the search also resolves to the final item; `>=` avoids that work.
        if (offset >= this._totalSize) {
            return this._count - 1;
        }

        let index = 0;

        for (
            let bitMask = this._mostSignificantBit;
            bitMask > 0;
            bitMask >>= 1
        ) {
            const candidate = index + bitMask;

            /*
             * A non-power-of-two count can make binary lifting probe beyond
             * the logical tree. For example, with count=65 and offset=645,
             * the search accepts 64 and then probes candidate 96. Depending
             * on the current capacity that is either padding or a typed-array
             * OOB read. Both compare as false, but the OOB case deoptimizes
             * this hot path in V8, so the logical bound is performance-critical.
             */
            // Stryker disable next-line all: Out-of-range candidates are result-equivalent, but the guard prevents typed-array OOB reads and V8 deopts.
            if (candidate <= this._count && offset > this._tree[candidate]) {
                index = candidate;
                offset -= this._tree[candidate];
            }
        }

        return index;
    }

    /**
     * Compute the exclusive common-ancestor boundary for a measurement batch.
     *
     * @param from - Inclusive first measured item index.
     * @param to - Exclusive last measured item index.
     * @returns An exclusive Fenwick-tree update boundary, or zero for an empty
     * range.
     * @remarks Pass the returned value unchanged to every
     * {@link SizeIndex._updateSize} call and then to
     * {@link SizeIndex._completeUpdateBatch}.
     */
    _getUpdateLimit(from: number, to: number) {
        if (from >= to) {
            return 0;
        }

        return Math.min(this._tree.length, getLiftingLimit(from, to - 1));
    }

    /**
     * Apply one measured size below a batch's common-ancestor boundary.
     *
     * @param index - Logical item index to update.
     * @param size - Measured finite, non-negative item size.
     * @param updateLimit - Exclusive boundary returned by
     * {@link SizeIndex._getUpdateLimit} for the complete batch.
     * @returns Difference between the measured and previously cached size, or
     * zero for an invalid/no-op update.
     */
    // check-hot: SizeIndex._updateSize
    _updateSize(index: number, size: number, updateLimit: number) {
        if (
            index < 0 ||
            index >= this._count ||
            index >= updateLimit ||
            !Number.isFinite(size) ||
            size < 0
        ) {
            return 0.0;
        }

        const delta = size - this._sizes[index];

        // Stryker disable next-line all: Updating a Fenwick tree by zero is equivalent but needlessly walks the tree.
        if (delta !== 0.0) {
            this._sizes[index] = size;
            update(this._tree, index + 1, delta, updateLimit);
        }

        return delta;
    }

    /**
     * Propagate one measurement batch's combined delta through shared
     * Fenwick-tree ancestors and update `SizeIndex`'s cached total.
     *
     * @param updateLimit - Boundary used for every preceding
     * {@link SizeIndex._updateSize} call.
     * @param totalDelta - Sum of the deltas returned by those calls.
     */
    // check-hot: SizeIndex._completeUpdateBatch
    _completeUpdateBatch(updateLimit: number, totalDelta: number) {
        // Stryker disable next-line all: Applying a zero batch is equivalent but needlessly walks the tree.
        if (totalDelta !== 0.0) {
            update(this._tree, updateLimit, totalDelta, this._tree.length);
            this._totalSize += totalDelta;
        }
    }

    /** Grow dense storage while preserving cached effective sizes. */
    private _ensureCapacity(requiredCapacity: number) {
        if (requiredCapacity <= this._capacity) {
            return;
        }

        const capacity = getNextSizeIndexCapacity(
            this._capacity,
            requiredCapacity
        );
        const sizes = growFloat64Array(this._sizes, capacity);

        sizes.fill(this._estimatedSize, this._capacity);

        const tree = growFloat64Array(this._tree, capacity + 1);
        syncWithArray(tree, sizes);

        this._capacity = capacity;
        this._sizes = sizes;
        this._tree = tree;
    }
}

export default SizeIndex;
