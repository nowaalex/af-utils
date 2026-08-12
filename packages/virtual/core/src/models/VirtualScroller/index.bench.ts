// @vitest-environment jsdom

import "../../benchmarks/resizeObserver";
import { bench, describe } from "vitest";
import VirtualScroller from ".";

const ITEM_COUNT = 100_000;
const QUERY_COUNT = 10_000;
const MEASUREMENT_COUNT = 64;
let benchmarkSink = 0.0;

const model = new VirtualScroller({
    estimatedItemSize: 40,
    estimatedWidgetSize: 600,
    itemCount: ITEM_COUNT
});

describe("VirtualScroller numeric facade", () => {
    bench("10k getOffset calls over 100k items", () => {
        let checksum = 0.0;

        for (let query = 0; query < QUERY_COUNT; query++) {
            checksum += model.getOffset((query * 7_919) % ITEM_COUNT);
        }

        benchmarkSink = checksum;
    });

    bench("10k getIndex calls over 100k items", () => {
        let checksum = 0;

        for (let query = 0; query < QUERY_COUNT; query++) {
            checksum += model.getIndex(
                (((query * 104_729) % 1_000_000) / 1_000_000) * model.scrollSize
            );
        }

        benchmarkSink = checksum;
    });
});

describe("VirtualScroller range synchronization", () => {
    const target = {
        scrollTop: 0,
        clientHeight: 600,
        addEventListener() {},
        removeEventListener() {},
        getBoundingClientRect: () => ({ top: 0 }),
        scroll() {}
    } as unknown as HTMLElement;
    const scrollModel = new VirtualScroller({
        estimatedItemSize: 40,
        estimatedWidgetSize: 600,
        itemCount: ITEM_COUNT
    });
    const hotModel = scrollModel as unknown as {
        _syncScrollPosition(): void;
    };

    scrollModel.setScroller(target);

    bench("10k mixed-direction range synchronizations", () => {
        for (let update = 0; update < QUERY_COUNT; update++) {
            target.scrollTop =
                ((update * 104_729) % (ITEM_COUNT * 40 - 600)) | 0;
            hotModel._syncScrollPosition();
        }

        benchmarkSink = scrollModel.from + scrollModel.to;
    });
});

describe("VirtualScroller measurements", () => {
    const measurementModel = new VirtualScroller({
        estimatedItemSize: 40,
        estimatedWidgetSize: MEASUREMENT_COUNT * 40,
        itemCount: ITEM_COUNT
    });
    const hotModel = measurementModel as unknown as {
        _applyMeasurements(entries: readonly ResizeObserverEntry[]): void;
        _items: { _elementIndexes: WeakMap<object, number> };
    };
    const sizes = Array.from({ length: MEASUREMENT_COUNT }, () => ({
        blockSize: 40,
        inlineSize: 40
    }));
    const entries = sizes.map((size, index) => {
        const target = {};
        hotModel._items._elementIndexes.set(target, index);
        return {
            target,
            borderBoxSize: [size]
        } as unknown as ResizeObserverEntry;
    });
    let generation = 0;

    bench("batched resize of 64 rendered items", () => {
        generation++;
        for (let index = 0; index < MEASUREMENT_COUNT; index++) {
            sizes[index].blockSize = 30 + ((index + generation) % 41);
        }

        hotModel._applyMeasurements(entries);
        benchmarkSink = measurementModel.scrollSize;
    });
});

void benchmarkSink;
