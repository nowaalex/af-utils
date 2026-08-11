import { describe, expect, test } from "vitest";
import { MAX_SIZE_INDEX_CAPACITY } from "../../constants";
import SizeIndex, {
    assertEstimatedSize,
    assertSizeIndexCount,
    getNextSizeIndexCapacity
} from ".";

type SizeIndexInternals = {
    _mostSignificantBit: number;
    _sizes: Float64Array;
    _measured: Uint8Array;
    _tree: Float64Array;
};

const applySizes = (index: SizeIndex, sizes: readonly number[]) => {
    const updateLimit = index.getUpdateLimit(0, sizes.length);
    let totalDelta = 0.0;

    for (let itemIndex = 0; itemIndex < sizes.length; itemIndex++) {
        totalDelta += index.updateSize(
            itemIndex,
            sizes[itemIndex],
            updateLimit
        );
    }

    index.completeUpdateBatch(updateLimit, totalDelta);
};

describe("SizeIndex capacity", () => {
    test("grows geometrically and never beyond the fixed limit", () => {
        expect(getNextSizeIndexCapacity(0, 1)).toBe(64);
        expect(getNextSizeIndexCapacity(64, 64)).toBe(64);
        expect(getNextSizeIndexCapacity(64, 65)).toBe(96);
        expect(getNextSizeIndexCapacity(96, 97)).toBe(144);
        expect(getNextSizeIndexCapacity(64, 1_000)).toBe(1_000);
        expect(
            getNextSizeIndexCapacity(
                MAX_SIZE_INDEX_CAPACITY - 1,
                MAX_SIZE_INDEX_CAPACITY
            )
        ).toBe(MAX_SIZE_INDEX_CAPACITY);
    });

    test("does not reallocate while count stays within capacity", () => {
        const index = new SizeIndex(40);

        index.setCount(1);
        expect(index.capacity).toBe(64);
        const internals = index as unknown as SizeIndexInternals;
        const sizes = internals._sizes;
        const measured = internals._measured;
        const tree = internals._tree;

        index.setCount(64);
        expect(index.capacity).toBe(64);
        expect(internals._sizes).toBe(sizes);
        expect(internals._measured).toBe(measured);
        expect(internals._tree).toBe(tree);

        index.setCount(65);
        expect(index.capacity).toBe(96);
        expect(internals._mostSignificantBit).toBe(64);
    });

    test.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        "rejects invalid item count %s",
        count => {
            const index = new SizeIndex(40);
            expect(() => index.setCount(count)).toThrow(RangeError);
        }
    );

    test("rejects counts beyond the fixed capacity before allocating", () => {
        const index = new SizeIndex(40);

        expect(() => index.setCount(MAX_SIZE_INDEX_CAPACITY + 1)).toThrow(
            RangeError
        );
        expect(index.capacity).toBe(0);
    });

    test("accepts the maximum count and reports invalid input precisely", () => {
        expect(() =>
            assertSizeIndexCount(MAX_SIZE_INDEX_CAPACITY)
        ).not.toThrow();
        expect(() => assertSizeIndexCount(-1)).toThrow(
            `itemCount must be an integer between 0 and ${MAX_SIZE_INDEX_CAPACITY}. Got: -1`
        );
    });

    test("reports whether count actually changed", () => {
        const index = new SizeIndex(40);

        expect(index.count).toBe(0);
        expect(index.setCount(0)).toBe(false);
        expect(index.setCount(1)).toBe(true);
        expect(index.setCount(1)).toBe(false);
        expect(index.count).toBe(1);
        expect(index.totalSize).toBe(40);
        expect(index.setCount(0)).toBe(true);
        expect(index.totalSize).toBe(0);
        expect(
            (index as unknown as SizeIndexInternals)._mostSignificantBit
        ).toBe(0);
    });
});

describe("SizeIndex measurements", () => {
    test("keeps measured sizes and updates unmeasured estimates", () => {
        const index = new SizeIndex(40);
        index.setCount(4);

        const updateLimit = index.getUpdateLimit(0, 4);
        const delta = index.updateSize(1, 75, updateLimit);
        index.completeUpdateBatch(updateLimit, delta);

        expect(index.totalSize).toBe(195);

        index.setEstimatedSize(100);

        expect(index.getSize(0)).toBe(100);
        expect(index.getSize(1)).toBe(75);
        expect(index.getSize(2)).toBe(100);
        expect(index.totalSize).toBe(375);
    });

    test("validates estimates and reports no-op estimate updates", () => {
        expect(() => assertEstimatedSize(1)).not.toThrow();
        expect(() => assertEstimatedSize(0)).toThrow(RangeError);
        expect(() => new SizeIndex(0)).toThrow(
            "estimatedItemSize must be a finite positive number. Got: 0"
        );

        const index = new SizeIndex(40);
        index.setCount(2);

        expect(index.estimatedSize).toBe(40);
        expect(index.setEstimatedSize(40)).toBe(false);
        expect(index.setEstimatedSize(50)).toBe(true);
        expect(index.estimatedSize).toBe(50);
        expect(index.totalSize).toBe(100);

        for (const estimate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
            expect(() => index.setEstimatedSize(estimate)).toThrow(RangeError);
        }
    });

    test("preserves measurements across shrink, regrow and reallocation", () => {
        const index = new SizeIndex(40);
        index.setCount(64);
        applySizes(
            index,
            Array.from({ length: 64 }, (_, i) => i + 10)
        );

        index.setCount(8);
        index.setCount(65);

        expect(index.capacity).toBe(96);
        expect(index.getSize(7)).toBe(17);
        expect(index.getSize(63)).toBe(73);
        expect(index.getSize(64)).toBe(40);
    });

    test("ignores stale and invalid measurement updates", () => {
        const index = new SizeIndex(40);
        index.setCount(2);
        const updateLimit = index.getUpdateLimit(0, 2);

        expect(index.updateSize(-1, 10, updateLimit)).toBe(0);
        expect(index.updateSize(2, 10, updateLimit)).toBe(0);
        expect(index.updateSize(0, -1, updateLimit)).toBe(0);
        expect(index.updateSize(0, Number.NaN, updateLimit)).toBe(0);
        expect(index.totalSize).toBe(80);
    });

    test("accepts zero-sized items and keeps them measured", () => {
        const index = new SizeIndex(40);
        index.setCount(2);
        const updateLimit = index.getUpdateLimit(0, 2);

        expect(index.updateSize(0, 0, updateLimit)).toBe(-40);
        index.completeUpdateBatch(updateLimit, -40);
        expect(index.totalSize).toBe(40);

        index.setEstimatedSize(100);
        expect(index.getSize(0)).toBe(0);
        expect(index.getSize(1)).toBe(100);
        expect(index.totalSize).toBe(100);
    });

    test("keeps an equal measured size when the estimate changes", () => {
        const index = new SizeIndex(40);
        index.setCount(2);
        const updateLimit = index.getUpdateLimit(0, 1);

        expect(index.updateSize(0, 40, updateLimit)).toBe(0);
        index.setEstimatedSize(100);

        expect(index.getSize(0)).toBe(40);
        expect(index.getSize(1)).toBe(100);
        expect(index.totalSize).toBe(140);
    });

    test("respects the exclusive batch update limit", () => {
        const index = new SizeIndex(40);
        index.setCount(8);

        expect(index.updateSize(3, 50, 4)).toBe(10);
        expect(index.updateSize(4, 50, 4)).toBe(0);
        index.completeUpdateBatch(4, 10);

        expect(index.getSize(3)).toBe(50);
        expect(index.getSize(4)).toBe(40);
        expect(index.totalSize).toBe(330);
    });

    test("rejects an index equal to count independently of update limit", () => {
        const index = new SizeIndex(40);
        index.setCount(2);

        expect(index.updateSize(2, 100, 3)).toBe(0);
        expect(index.totalSize).toBe(80);
    });
});

describe("SizeIndex prefix sums", () => {
    test("handles exact offset and batch boundaries", () => {
        const index = new SizeIndex(10);

        expect(index.getUpdateLimit(0, 1)).toBe(0);
        index.setCount(65);
        expect(index.getUpdateLimit(2, 2)).toBe(0);
        expect(index.getUpdateLimit(3, 3)).toBe(0);
        expect(index.getUpdateLimit(3, 2)).toBe(0);
        expect(index.getUpdateLimit(2, 3)).toBe(3);
        expect(index.getUpdateLimit(0, 65)).toBe(66);

        expect(index.getIndex(-1)).toBe(0);
        expect(index.getIndex(0)).toBe(0);
        expect(index.getIndex(10)).toBe(0);
        expect(index.getIndex(11)).toBe(1);
        expect(index.getIndex(645)).toBe(64);
        expect(index.getIndex(index.totalSize)).toBe(64);
        expect(index.getIndex(index.totalSize + 1)).toBe(64);
    });

    test("matches a naive implementation for deterministic random data", () => {
        const count = 2_047;
        let state = 0x12345678;
        const random = () => {
            state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
            return state / 0x1_0000_0000;
        };
        const sizes = Array.from(
            { length: count },
            () => 1 + Math.floor(random() * 500)
        );
        const offsets = new Float64Array(count + 1);
        const index = new SizeIndex(40);

        index.setCount(count);
        applySizes(index, sizes);

        for (let itemIndex = 0; itemIndex < count; itemIndex++) {
            offsets[itemIndex + 1] = offsets[itemIndex] + sizes[itemIndex];
        }

        expect(index.totalSize).toBe(offsets[count]);

        for (let itemIndex = 0; itemIndex <= count; itemIndex++) {
            expect(index.getOffset(itemIndex)).toBe(offsets[itemIndex]);
        }

        for (let attempt = 0; attempt < 10_000; attempt++) {
            const offset = random() * index.totalSize;
            let naiveIndex = 0;

            while (naiveIndex < count - 1 && offset > offsets[naiveIndex + 1]) {
                naiveIndex++;
            }

            expect(index.getIndex(offset)).toBe(naiveIndex);
        }
    });
});
