import {
    MAX_SIZE_INDEX_CAPACITY,
    MIN_SIZE_INDEX_CAPACITY,
    SIZE_INDEX_GROWTH_DENOMINATOR,
    SIZE_INDEX_GROWTH_NUMERATOR
} from "../../constants";
import { getLiftingLimit, syncWithArray, update } from "../../utils/fTree";

/** Shared zero-allocation backing store used before the first capacity growth. */
const EMPTY_SIZES = new Float64Array(0);

/** Shared zero-allocation measurement bitmap used by an empty index. */
const EMPTY_MEASUREMENTS = new Uint8Array(0);

/**
 * Validate an item count before it is used to allocate typed arrays.
 *
 * @param count - Requested logical item count.
 * @throws {@link RangeError} if `count` is not a non-negative safe integer or
 * exceeds the Fenwick-tree capacity limit.
 * @internal
 */
export const assertSizeIndexCount = (count: number) => {
    if (
        !Number.isSafeInteger(count) ||
        count < 0 ||
        count > MAX_SIZE_INDEX_CAPACITY
    ) {
        throw new RangeError(
            `itemCount must be an integer between 0 and ${MAX_SIZE_INDEX_CAPACITY}. Got: ${count}`
        );
    }
};

/**
 * Validate an estimated item size independently of `SizeIndex` instance state.
 *
 * @param size - Candidate estimated item size.
 * @throws {@link RangeError} if `size` is not finite and strictly positive.
 * @internal
 */
export const assertEstimatedSize = (size: number) => {
    if (!Number.isFinite(size) || size <= 0) {
        throw new RangeError(
            `estimatedItemSize must be a finite positive number. Got: ${size}`
        );
    }
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
 * `O(log n)`. A parallel byte array distinguishes measured items from values
 * that still use the estimate.
 *
 * Capacity only grows, while `count` is the logical boundary. Keeping all
 * numeric storage in typed arrays and keeping this class free of DOM and event
 * dependencies gives its hot paths stable, monomorphic inputs.
 *
 * Multiple measurements should be applied as one batch: obtain an exclusive
 * lifting boundary with {@link SizeIndex.getUpdateLimit}, call
 * {@link SizeIndex.updateSize} for every item, sum the returned deltas, and
 * finish with {@link SizeIndex.completeUpdateBatch}. This updates the common
 * Fenwick ancestors once rather than once per item.
 *
 * @internal
 */
class SizeIndex {
    /** Logical number of addressable items. */
    private _count = 0;

    /** Number of allocated slots shared by all typed-array backing stores. */
    private _capacity = 0;

    /** Highest power-of-two bit used to lift Fenwick-tree index searches. */
    private _mostSignificantBit = 0;

    /** Size assigned to every item that has not been measured. */
    private _estimatedSize: number;

    /** Cached prefix sum for the complete logical range `[0, count)`. */
    private _totalSize = 0.0;

    /** Dense effective sizes, including estimates for unmeasured items. */
    private _sizes = EMPTY_SIZES;

    /** Byte bitmap whose nonzero entries mark explicitly measured items. */
    private _measured = EMPTY_MEASUREMENTS;

    /** Fenwick tree over `_sizes`, stored with a one-based root convention. */
    private _tree = EMPTY_SIZES;

    /**
     * Create an empty size index.
     *
     * @param estimatedSize - Initial positive finite size for every unmeasured
     * item.
     */
    constructor(estimatedSize: number) {
        assertEstimatedSize(estimatedSize);
        this._estimatedSize = estimatedSize;
    }

    /** Logical number of addressable items. */
    get count() {
        return this._count;
    }

    /** Number of allocated item slots; always greater than or equal to `count`. */
    get capacity() {
        return this._capacity;
    }

    /** Prefix sum for the complete logical range `[0, count)`. */
    get totalSize() {
        return this._totalSize;
    }

    /** Size currently assigned to items that have not been measured. */
    get estimatedSize() {
        return this._estimatedSize;
    }

    /**
     * Replace the size of every unmeasured item.
     *
     * @param estimatedSize - New positive finite estimate.
     * @returns `true` when the estimate changed, otherwise `false`.
     * @remarks Measured sizes are preserved, including measured zero sizes.
     */
    setEstimatedSize(estimatedSize: number) {
        assertEstimatedSize(estimatedSize);

        if (estimatedSize === this._estimatedSize) {
            return false;
        }

        this._estimatedSize = estimatedSize;

        // Stryker disable next-line EqualityOperator: Writing once past a typed array is an unobservable no-op, while `< capacity` documents the intended bound.
        for (let index = 0; index < this._capacity; index++) {
            if (this._measured[index] === 0) {
                this._sizes[index] = estimatedSize;
            }
        }

        if (this._capacity > 0) {
            syncWithArray(this._tree, this._sizes);
        }
        this._totalSize = this.getOffset(this._count);
        return true;
    }

    /**
     * Change the logical item count without shrinking allocated storage.
     *
     * @param count - New logical item count.
     * @returns `true` when the logical count changed, otherwise `false`.
     * @remarks Sizes within retained capacity survive shrink-and-regrow cycles.
     */
    setCount(count: number) {
        assertSizeIndexCount(count);

        if (count === this._count) {
            return false;
        }

        this._ensureCapacity(count);
        this._count = count;
        this._mostSignificantBit =
            count === 0 ? 0 : 1 << (31 - Math.clz32(count));
        this._totalSize = this.getOffset(count);
        return true;
    }

    /**
     * Read the cached size of an item in `O(1)`.
     *
     * @param index - Item index in the logical range `[0, count)`.
     */
    getSize(index: number) {
        return this._sizes[index];
    }

    /**
     * Sum item sizes in the half-open range `[0, index)` in `O(log n)`.
     *
     * @param index - Exclusive item boundary in `[0, count]`.
     * @returns Pixel offset of that boundary.
     */
    getOffset(index: number) {
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
    getIndex(offset: number) {
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
            let bitMask = this._mostSignificantBit, candidate = 0;
            bitMask > 0;
            bitMask >>= 1
        ) {
            candidate = index + bitMask;

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
     * {@link SizeIndex.updateSize} call and then to
     * {@link SizeIndex.completeUpdateBatch}.
     */
    getUpdateLimit(from: number, to: number) {
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
     * {@link SizeIndex.getUpdateLimit} for the complete batch.
     * @returns Difference between the measured and previously cached size, or
     * zero for an invalid/no-op update.
     * @remarks A valid item is marked as measured even when its numeric size is
     * unchanged, so later estimate changes do not overwrite it.
     */
    updateSize(index: number, size: number, updateLimit: number) {
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
        this._measured[index] = 1;

        // Stryker disable next-line all: Updating a Fenwick tree by zero is equivalent but needlessly walks the tree.
        if (delta !== 0.0) {
            this._sizes[index] = size;
            update(this._tree, index + 1, delta, updateLimit);
        }

        return delta;
    }

    /**
     * Propagate one measurement batch's combined delta through shared
     * Fenwick-tree ancestors and update {@link SizeIndex.totalSize}.
     *
     * @param updateLimit - Boundary used for every preceding
     * {@link SizeIndex.updateSize} call.
     * @param totalDelta - Sum of the deltas returned by those calls.
     */
    completeUpdateBatch(updateLimit: number, totalDelta: number) {
        // Stryker disable next-line all: Applying a zero batch is equivalent but needlessly walks the tree.
        if (totalDelta !== 0.0) {
            update(this._tree, updateLimit, totalDelta, this._tree.length);
            this._totalSize += totalDelta;
        }
    }

    /** Grow dense storage while preserving cached values and measurement state. */
    private _ensureCapacity(requiredCapacity: number) {
        if (requiredCapacity <= this._capacity) {
            return;
        }

        const capacity = getNextSizeIndexCapacity(
            this._capacity,
            requiredCapacity
        );
        const sizes = new Float64Array(capacity);
        const measured = new Uint8Array(capacity);

        sizes.fill(this._estimatedSize);
        sizes.set(this._sizes);
        measured.set(this._measured);

        const tree = new Float64Array(capacity + 1);
        syncWithArray(tree, sizes);

        this._capacity = capacity;
        this._sizes = sizes;
        this._measured = measured;
        this._tree = tree;
    }
}

export default SizeIndex;
