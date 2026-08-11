import { bench, describe } from "vitest";
import { horizontalAxisAdapter, verticalAxisAdapter } from "../axisAdapters";
import { ElementScrollerAdapter, WindowScrollerAdapter } from ".";

type LegacyOffsetKey = "scrollTop" | "scrollLeft" | "scrollY" | "scrollX";
type LegacyTarget = Record<LegacyOffsetKey, number>;

class LegacyScrollerAdapter {
    private readonly _target: LegacyTarget;
    private readonly _scrollKey: LegacyOffsetKey;

    constructor(target: LegacyTarget, scrollKey: LegacyOffsetKey) {
        this._target = target;
        this._scrollKey = scrollKey;
    }

    readOffset() {
        return this._target[this._scrollKey];
    }
}

const READS_PER_SAMPLE = 40_000;
const target: LegacyTarget = {
    scrollTop: 101,
    scrollLeft: 202,
    scrollY: 303,
    scrollX: 404
};
const element = target as unknown as HTMLElement;
const windowObject = target as unknown as Window;
const namedReaders = [
    new ElementScrollerAdapter(element, verticalAxisAdapter),
    new ElementScrollerAdapter(element, horizontalAxisAdapter),
    new WindowScrollerAdapter(windowObject, verticalAxisAdapter),
    new WindowScrollerAdapter(windowObject, horizontalAxisAdapter)
];
const computedReaders = [
    new LegacyScrollerAdapter(target, "scrollTop"),
    new LegacyScrollerAdapter(target, "scrollLeft"),
    new LegacyScrollerAdapter(target, "scrollY"),
    new LegacyScrollerAdapter(target, "scrollX")
];
let benchmarkSink = 0;

describe("axis adapter property access", () => {
    bench("named axis adapters over four scroller modes", () => {
        let checksum = 0;

        for (let index = 0; index < READS_PER_SAMPLE; index++) {
            checksum += namedReaders[index & 3]._readOffset();
        }

        benchmarkSink = checksum;
    });

    bench("legacy target[this._scrollKey] over four modes", () => {
        let checksum = 0;

        for (let index = 0; index < READS_PER_SAMPLE; index++) {
            checksum += computedReaders[index & 3].readOffset();
        }

        benchmarkSink = checksum;
    });
});

void benchmarkSink;
