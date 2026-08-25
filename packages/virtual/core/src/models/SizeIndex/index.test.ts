import { describe, expect, test } from "vitest";
import {
    array,
    assert as assertProperty,
    constant,
    integer,
    nat,
    oneof,
    property,
    record
} from "fast-check";
import { VirtualScrollerError } from "#virtual-errors";
import { MAX_SIZE_INDEX_CAPACITY } from "../../constants";
import {
    VirtualScrollerErrorCode,
    VirtualScrollerErrorIndex
} from "../../errors/codes";
import SizeIndex, {
    assertEstimatedSize,
    assertSizeIndexCount,
    getNextSizeIndexCapacity
} from ".";

type SizeIndexInternals = {
    _mostSignificantBit: number;
    _sizes: Float64Array;
    _tree: Float64Array;
};

const applySizes = (index: SizeIndex, sizes: readonly number[]) => {
    const updateLimit = index._getUpdateLimit(0, sizes.length);
    let totalDelta = 0.0;

    for (let itemIndex = 0; itemIndex < sizes.length; itemIndex++) {
        totalDelta += index._updateSize(
            itemIndex,
            sizes[itemIndex],
            updateLimit
        );
    }

    index._completeUpdateBatch(updateLimit, totalDelta);
};

type SizeIndexOperation =
    | { kind: "count"; count: number }
    | { kind: "estimate"; size: number }
    | { kind: "resize"; index: number; size: number }
    | {
          kind: "splice";
          start: number;
          deleteCount: number;
          insertCount: number;
      };

const sizeIndexOperation = oneof<SizeIndexOperation>(
    record({
        kind: constant("count"),
        count: integer({ min: 0, max: 128 })
    }),
    record({
        kind: constant("estimate"),
        size: integer({ min: 1, max: 256 })
    }),
    record({
        kind: constant("resize"),
        index: nat(),
        size: integer({ min: 1, max: 256 })
    }),
    record({
        kind: constant("splice"),
        start: nat(),
        deleteCount: nat({ max: 32 }),
        insertCount: nat({ max: 32 })
    })
);

const createEstimatedSizes = (count: number, estimate: number) =>
    Array.from({ length: count }, () => estimate);

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

        index._setCount(1);
        expect(index._capacity).toBe(64);
        const internals = index as unknown as SizeIndexInternals;
        const sizes = internals._sizes;
        const tree = internals._tree;

        index._setCount(64);
        expect(index._capacity).toBe(64);
        expect(internals._sizes).toBe(sizes);
        expect(internals._tree).toBe(tree);

        index._setCount(65);
        expect(index._capacity).toBe(96);
        expect(sizes.byteLength).toBe(0);
        expect(tree.byteLength).toBe(0);
        expect(internals._mostSignificantBit).toBe(64);
    });

    test("grows without transferable ArrayBuffer support", () => {
        const transfer = ArrayBuffer.prototype.transferToFixedLength;
        // oxlint-disable-next-line eslint/no-extend-native -- The test must emulate an engine without transferable ArrayBuffers.
        Object.defineProperty(ArrayBuffer.prototype, "transferToFixedLength", {
            configurable: true,
            value: undefined
        });

        try {
            const index = new SizeIndex(40);
            index._setCount(64);
            const updateLimit = index._getUpdateLimit(0, 1);
            const totalDelta = index._updateSize(0, 80, updateLimit);
            index._completeUpdateBatch(updateLimit, totalDelta);
            index._setCount(65);

            expect(index._getSize(0)).toBe(80);
            expect(index._getSize(64)).toBe(40);
        } finally {
            // oxlint-disable-next-line eslint/no-extend-native -- Restore the built-in immediately after the compatibility-path test.
            Object.defineProperty(
                ArrayBuffer.prototype,
                "transferToFixedLength",
                { configurable: true, value: transfer }
            );
        }
    });

    test.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        "rejects invalid item count %s",
        count => {
            const index = new SizeIndex(40);
            expect(() => index._setCount(count)).toThrow(VirtualScrollerError);
        }
    );

    test("rejects counts beyond the fixed capacity before allocating", () => {
        const index = new SizeIndex(40);

        expect(() => index._setCount(MAX_SIZE_INDEX_CAPACITY + 1)).toThrow(
            VirtualScrollerError
        );
        expect(index._capacity).toBe(0);
    });

    test("accepts the maximum count and reports invalid input precisely", () => {
        expect(() =>
            assertSizeIndexCount(MAX_SIZE_INDEX_CAPACITY)
        ).not.toThrow();
        expect(() => assertSizeIndexCount(-1)).toThrowError(
            expect.objectContaining({
                code: VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_ITEM_COUNT
                ]
            })
        );
    });

    test("reports whether count actually changed", () => {
        const index = new SizeIndex(40);

        expect(index._count).toBe(0);
        expect(index._setCount(0)).toBe(false);
        expect(index._setCount(1)).toBe(true);
        expect(index._setCount(1)).toBe(false);
        expect(index._count).toBe(1);
        expect(index._totalSize).toBe(40);
        expect(index._setCount(0)).toBe(true);
        expect(index._totalSize).toBe(0);
        expect(
            (index as unknown as SizeIndexInternals)._mostSignificantBit
        ).toBe(0);
    });
});

describe("SizeIndex cached sizes", () => {
    test("resets every cached size when the estimate changes", () => {
        const index = new SizeIndex(40);
        index._setCount(4);

        const updateLimit = index._getUpdateLimit(0, 4);
        const delta = index._updateSize(1, 75, updateLimit);
        index._completeUpdateBatch(updateLimit, delta);

        expect(index._totalSize).toBe(195);

        expect(index._setEstimatedSize(100)).toEqual({
            changed: true,
            totalDelta: 205
        });

        expect(index._getSize(0)).toBe(100);
        expect(index._getSize(1)).toBe(100);
        expect(index._getSize(2)).toBe(100);
        expect(index._totalSize).toBe(400);
    });

    test("preserves the requested cached range when the estimate changes", () => {
        const index = new SizeIndex(40);
        index._setCount(4);
        applySizes(index, [10, 20, 30, 50]);

        expect(index._setEstimatedSize(100, 1, 3)).toEqual({
            changed: true,
            totalDelta: 140
        });
        expect(Array.from({ length: 4 }, (_, i) => index._getSize(i))).toEqual([
            100, 20, 30, 100
        ]);
        expect(index._totalSize).toBe(250);
    });

    test("does not report a change when only the preserved range differs", () => {
        const index = new SizeIndex(40);
        index._setCount(4);
        applySizes(index, [100, 20, 30, 100]);

        expect(index._setEstimatedSize(100, 1, 3)).toEqual({
            changed: false,
            totalDelta: 0
        });
        expect(Array.from({ length: 4 }, (_, i) => index._getSize(i))).toEqual([
            100, 20, 30, 100
        ]);
    });

    test("validates estimates and reports no-op estimate updates", () => {
        expect(() => assertEstimatedSize(1)).not.toThrow();
        expect(() => assertEstimatedSize(0)).toThrow(VirtualScrollerError);
        expect(() => new SizeIndex(0)).toThrowError(
            expect.objectContaining({
                code: VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_ITEM_SIZE
                ],
                message: expect.stringContaining("Received: 0")
            })
        );

        const index = new SizeIndex(40);
        index._setCount(2);

        expect(index._estimatedSize).toBe(40);
        expect(index._setEstimatedSize(40)).toEqual({
            changed: false,
            totalDelta: 0
        });
        expect(index._setEstimatedSize(50)).toEqual({
            changed: true,
            totalDelta: 20
        });
        expect(index._estimatedSize).toBe(50);
        expect(index._totalSize).toBe(100);

        for (const estimate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
            expect(() => index._setEstimatedSize(estimate)).toThrow(
                VirtualScrollerError
            );
        }
    });

    test("clears removed sizes across shrink and regrow", () => {
        const index = new SizeIndex(40);
        index._setCount(64);
        applySizes(
            index,
            Array.from({ length: 64 }, (_, i) => i + 10)
        );

        index._setCount(8);
        index._setCount(65);

        expect(index._capacity).toBe(96);
        expect(index._getSize(7)).toBe(17);
        expect(index._getSize(63)).toBe(40);
        expect(index._getSize(64)).toBe(40);
    });

    test("invalidates only the requested cached-size range", () => {
        const index = new SizeIndex(40);
        index._setCount(4);
        applySizes(index, [10, 20, 30, 50]);

        expect(index._invalidateSizes(1, 3)).toEqual({
            changed: true,
            totalDelta: 30
        });
        expect(Array.from({ length: 4 }, (_, i) => index._getSize(i))).toEqual([
            10, 40, 40, 50
        ]);
        expect(index._totalSize).toBe(140);
        expect(index._invalidateSizes(1, 3)).toEqual({
            changed: false,
            totalDelta: 0
        });
    });

    test("moves retained cached sizes with a collection splice", () => {
        const index = new SizeIndex(40);
        index._setCount(5);
        applySizes(index, [10, 20, 30, 40, 50]);

        expect(index._splice(1, 2, 1)).toEqual({
            sizesChanged: true,
            totalDelta: -10
        });
        expect(index._count).toBe(4);
        expect(Array.from({ length: 4 }, (_, i) => index._getSize(i))).toEqual([
            10, 40, 40, 50
        ]);

        index._setEstimatedSize(100);
        expect(Array.from({ length: 4 }, (_, i) => index._getSize(i))).toEqual([
            100, 100, 100, 100
        ]);
        expect(index._totalSize).toBe(400);
    });

    test("ignores stale and invalid measurement updates", () => {
        const index = new SizeIndex(40);
        index._setCount(2);
        const updateLimit = index._getUpdateLimit(0, 2);

        expect(index._updateSize(-1, 10, updateLimit)).toBe(0);
        expect(index._updateSize(2, 10, updateLimit)).toBe(0);
        expect(index._updateSize(0, -1, updateLimit)).toBe(0);
        expect(index._updateSize(0, Number.NaN, updateLimit)).toBe(0);
        expect(index._totalSize).toBe(80);
    });

    test("accepts zero-sized items and resets them with a new estimate", () => {
        const index = new SizeIndex(40);
        index._setCount(2);
        const updateLimit = index._getUpdateLimit(0, 2);

        expect(index._updateSize(0, 0, updateLimit)).toBe(-40);
        index._completeUpdateBatch(updateLimit, -40);
        expect(index._totalSize).toBe(40);

        index._setEstimatedSize(100);
        expect(index._getSize(0)).toBe(100);
        expect(index._getSize(1)).toBe(100);
        expect(index._totalSize).toBe(200);
    });

    test("resets cached values equal to the previous estimate", () => {
        const index = new SizeIndex(40);
        index._setCount(2);
        const updateLimit = index._getUpdateLimit(0, 1);

        expect(index._updateSize(0, 40, updateLimit)).toBe(0);
        index._setEstimatedSize(100);

        expect(index._getSize(0)).toBe(100);
        expect(index._getSize(1)).toBe(100);
        expect(index._totalSize).toBe(200);
    });

    test("updates the estimate without publishing unchanged effective sizes", () => {
        const index = new SizeIndex(40);
        index._setCount(2);
        applySizes(index, [100, 100]);

        expect(index._setEstimatedSize(100)).toEqual({
            changed: false,
            totalDelta: 0
        });
        index._setCount(3);

        expect(Array.from({ length: 3 }, (_, i) => index._getSize(i))).toEqual([
            100, 100, 100
        ]);
    });

    test("splices estimate-only slots without reporting a size change", () => {
        const index = new SizeIndex(40);
        index._setCount(3);

        expect(index._splice(1, 1, 2)).toEqual({
            sizesChanged: false,
            totalDelta: 40
        });
        expect(Array.from({ length: 4 }, (_, i) => index._getSize(i))).toEqual([
            40, 40, 40, 40
        ]);
    });

    test("respects the exclusive batch update limit", () => {
        const index = new SizeIndex(40);
        index._setCount(8);

        expect(index._updateSize(3, 50, 4)).toBe(10);
        expect(index._updateSize(4, 50, 4)).toBe(0);
        index._completeUpdateBatch(4, 10);

        expect(index._getSize(3)).toBe(50);
        expect(index._getSize(4)).toBe(40);
        expect(index._totalSize).toBe(330);
    });

    test("rejects an index equal to count independently of update limit", () => {
        const index = new SizeIndex(40);
        index._setCount(2);

        expect(index._updateSize(2, 100, 3)).toBe(0);
        expect(index._totalSize).toBe(80);
    });
});

describe("SizeIndex reference model", () => {
    test("matches a plain-array model across generated operation sequences", () => {
        assertProperty(
            property(
                array(sizeIndexOperation, { maxLength: 200 }),
                operations => {
                    const index = new SizeIndex(40);
                    const sizes: number[] = [];
                    let estimate = 40;

                    for (const operation of operations) {
                        switch (operation.kind) {
                            case "count": {
                                const oldCount = sizes.length;
                                sizes.length = operation.count;
                                if (operation.count > oldCount) {
                                    sizes.fill(
                                        estimate,
                                        oldCount,
                                        operation.count
                                    );
                                }
                                index._setCount(operation.count);
                                break;
                            }
                            case "estimate": {
                                if (operation.size === estimate) break;
                                estimate = operation.size;
                                sizes.fill(estimate);
                                index._setEstimatedSize(estimate);
                                break;
                            }
                            case "resize": {
                                if (sizes.length === 0) break;
                                const itemIndex =
                                    operation.index % sizes.length;
                                const updateLimit = index._getUpdateLimit(
                                    itemIndex,
                                    itemIndex + 1
                                );
                                const delta = index._updateSize(
                                    itemIndex,
                                    operation.size,
                                    updateLimit
                                );
                                index._completeUpdateBatch(updateLimit, delta);
                                sizes[itemIndex] = operation.size;
                                break;
                            }
                            case "splice": {
                                const start =
                                    operation.start % (sizes.length + 1);
                                const deleteCount = Math.min(
                                    operation.deleteCount,
                                    sizes.length - start
                                );
                                const insertCount = Math.min(
                                    operation.insertCount,
                                    128 - sizes.length + deleteCount
                                );
                                if (deleteCount === 0 && insertCount === 0) {
                                    break;
                                }
                                sizes.splice(
                                    start,
                                    deleteCount,
                                    ...createEstimatedSizes(
                                        insertCount,
                                        estimate
                                    )
                                );
                                index._splice(start, deleteCount, insertCount);
                                break;
                            }
                        }

                        expect(index._count).toBe(sizes.length);
                        expect(index._totalSize).toBe(
                            sizes.reduce((sum, size) => sum + size, 0)
                        );
                        if (sizes.length > 0) {
                            const probe = sizes.length >> 1;
                            expect(index._getSize(probe)).toBe(sizes[probe]);
                            expect(index._getOffset(probe)).toBe(
                                sizes
                                    .slice(0, probe)
                                    .reduce((sum, size) => sum + size, 0)
                            );
                        }
                    }
                }
            ),
            { numRuns: 200 }
        );
    });
});

describe("SizeIndex prefix sums", () => {
    test("handles exact offset and batch boundaries", () => {
        const index = new SizeIndex(10);

        expect(index._getUpdateLimit(0, 1)).toBe(0);
        index._setCount(65);
        expect(index._getUpdateLimit(2, 2)).toBe(0);
        expect(index._getUpdateLimit(3, 3)).toBe(0);
        expect(index._getUpdateLimit(3, 2)).toBe(0);
        expect(index._getUpdateLimit(2, 3)).toBe(3);
        expect(index._getUpdateLimit(0, 65)).toBe(66);

        expect(index._getIndex(-1)).toBe(0);
        expect(index._getIndex(0)).toBe(0);
        expect(index._getIndex(10)).toBe(0);
        expect(index._getIndex(11)).toBe(1);
        expect(index._getIndex(645)).toBe(64);
        expect(index._getIndex(index._totalSize)).toBe(64);
        expect(index._getIndex(index._totalSize + 1)).toBe(64);
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

        index._setCount(count);
        applySizes(index, sizes);

        for (let itemIndex = 0; itemIndex < count; itemIndex++) {
            offsets[itemIndex + 1] = offsets[itemIndex] + sizes[itemIndex];
        }

        expect(index._totalSize).toBe(offsets[count]);

        for (let itemIndex = 0; itemIndex <= count; itemIndex++) {
            expect(index._getOffset(itemIndex)).toBe(offsets[itemIndex]);
        }

        for (let attempt = 0; attempt < 10_000; attempt++) {
            const offset = random() * index._totalSize;
            let naiveIndex = 0;

            while (naiveIndex < count - 1 && offset > offsets[naiveIndex + 1]) {
                naiveIndex++;
            }

            expect(index._getIndex(offset)).toBe(naiveIndex);
        }
    });
});
