import { bench, describe } from "vitest";
import SizeIndex from ".";

const ITEM_COUNT = 100_000;
const QUERY_COUNT = 10_000;
const MEASUREMENT_COUNT = 64;
let benchmarkSink = 0.0;

const createPopulatedIndex = () => {
    const index = new SizeIndex(40);
    index._setCount(ITEM_COUNT);

    const updateLimit = index._getUpdateLimit(0, ITEM_COUNT);
    let totalDelta = 0.0;

    for (let itemIndex = 0; itemIndex < ITEM_COUNT; itemIndex++) {
        totalDelta += index._updateSize(
            itemIndex,
            20 + (itemIndex % 61),
            updateLimit
        );
    }

    index._completeUpdateBatch(updateLimit, totalDelta);
    return index;
};

describe("SizeIndex queries", () => {
    const index = createPopulatedIndex();

    bench("10k getOffset calls over 100k items", () => {
        let checksum = 0.0;

        for (let query = 0; query < QUERY_COUNT; query++) {
            checksum += index._getOffset((query * 7_919) % ITEM_COUNT);
        }

        benchmarkSink = checksum;
    });

    bench("10k getIndex calls over 100k items", () => {
        let checksum = 0;

        for (let query = 0; query < QUERY_COUNT; query++) {
            checksum += index._getIndex(
                (((query * 104_729) % 1_000_000) / 1_000_000) *
                    index._totalSizeValue
            );
        }

        benchmarkSink = checksum;
    });
});

describe("SizeIndex updates", () => {
    const index = createPopulatedIndex();
    let generation = 0;

    bench("batched resize of 64 visible items", () => {
        const from =
            (generation++ * MEASUREMENT_COUNT) %
            (ITEM_COUNT - MEASUREMENT_COUNT);
        const to = from + MEASUREMENT_COUNT;
        const updateLimit = index._getUpdateLimit(from, to);
        let totalDelta = 0.0;

        for (let itemIndex = from; itemIndex < to; itemIndex++) {
            totalDelta += index._updateSize(
                itemIndex,
                30 + ((itemIndex + generation) % 41),
                updateLimit
            );
        }

        index._completeUpdateBatch(updateLimit, totalDelta);
    });

    bench("incremental append to 100k items", () => {
        const growingIndex = new SizeIndex(40);

        for (let count = 100; count <= ITEM_COUNT; count += 100) {
            growingIndex._setCount(count);
        }

        benchmarkSink = growingIndex._totalSizeValue;
    });
});

void benchmarkSink;
