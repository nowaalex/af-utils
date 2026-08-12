import { bench, describe } from "vitest";
import { VirtualScrollerEvent } from "../../../constants";
import VirtualScrollerEvents from ".";

const EMITS_PER_SAMPLE = 10_000;
const DEDUPE_PASSES = 8;
const DEDUPE_BATCHES_PER_SAMPLE = 100;
const DEDUPE_LISTENER_COUNTS = [1, 2, 4, 8, 16, 32, 64] as const;
const DEDUPE_EVENT_COUNTS = [1, 2, 4, 8, 16, 32, 64] as const;
const REVISION_OPERATIONS_PER_SAMPLE = 100_000;
const events = new VirtualScrollerEvents();
let benchmarkSink = 0;

events._subscribe(() => benchmarkSink++, VirtualScrollerEvent.RANGE);
events._subscribe(() => benchmarkSink++, VirtualScrollerEvent.RANGE);
events._subscribe(() => benchmarkSink++, VirtualScrollerEvent.RANGE);

const eventTarget = new EventTarget();
const rangeEvent = new Event("range");
eventTarget.addEventListener("range", () => benchmarkSink++);

class PerEventRevisions {
    private _revision = 0;
    private _revisions: [number, number, number] = [0, 0, 0];

    _emit(event: number) {
        const index = event === 1 ? 0 : event === 2 ? 1 : 2;
        this._revisions[index] = ++this._revision;
    }

    get(mask: number) {
        let revision = 0;
        if (mask & 1) revision = this._revisions[0];
        if (mask & 2 && this._revisions[1] > revision) {
            revision = this._revisions[1];
        }
        if (mask & 4 && this._revisions[2] > revision) {
            revision = this._revisions[2];
        }
        return revision;
    }
}

class PerMaskRevisions {
    private _revision = 0;
    private _revisions = [0, 0, 0, 0, 0, 0, 0, 0];

    _emit(event: number) {
        const revision = ++this._revision;
        for (let mask = 1; mask < this._revisions.length; mask++) {
            if (mask & event) this._revisions[mask] = revision;
        }
    }

    get(mask: number) {
        return this._revisions[mask & VirtualScrollerEvent.ALL] as number;
    }
}

const perEventRevisions = new PerEventRevisions();
const perMaskRevisions = new PerMaskRevisions();
eventTarget.addEventListener("range", () => benchmarkSink++);
eventTarget.addEventListener("range", () => benchmarkSink++);

describe("event dispatch", () => {
    bench("10k bit-flag dispatches", () => {
        for (let emit = 0; emit < EMITS_PER_SAMPLE; emit++) {
            events._emit(VirtualScrollerEvent.RANGE);
        }
    });

    bench("10k EventTarget string dispatches", () => {
        for (let emit = 0; emit < EMITS_PER_SAMPLE; emit++) {
            eventTarget.dispatchEvent(rangeEvent);
        }
    });
});

describe("event batching", () => {
    bench("coalesce 10k numeric events by subscription", () => {
        events._beginBatch();

        for (let emit = 0; emit < EMITS_PER_SAMPLE; emit++) {
            events._emit(VirtualScrollerEvent.RANGE);
        }

        events._endBatch();
    });
});

describe("event revision strategy", () => {
    bench("100k per-event writes + selected max reads", () => {
        let result = 0;
        for (
            let operation = 0;
            operation < REVISION_OPERATIONS_PER_SAMPLE;
            operation++
        ) {
            perEventRevisions._emit(1 << (operation % 3));
            result += perEventRevisions.get(1 + (operation % 7));
        }
        benchmarkSink = result;
    });

    bench("100k eager per-mask writes + direct reads", () => {
        let result = 0;
        for (
            let operation = 0;
            operation < REVISION_OPERATIONS_PER_SAMPLE;
            operation++
        ) {
            perMaskRevisions._emit(1 << (operation % 3));
            result += perMaskRevisions.get(1 + (operation % 7));
        }
        benchmarkSink = result;
    });
});

const comparisonCallbacks = Array.from(
    { length: DEDUPE_LISTENER_COUNTS.at(-1) ?? 0 },
    () => () => {
        benchmarkSink++;
    }
);

for (const listenerCount of DEDUPE_LISTENER_COUNTS) {
    // oxlint-disable-next-line eslint/no-loop-func -- A for-of const has a fresh binding per iteration; this callback intentionally registers one benchmark group per value.
    describe(`batch callback deduplication: ${listenerCount} unique`, () => {
        const callbacks = comparisonCallbacks.slice(0, listenerCount);
        const setQueue = new Set<() => void>();
        const arrayQueue: (() => void)[] = [];

        bench("Set.add", () => {
            for (let batch = 0; batch < DEDUPE_BATCHES_PER_SAMPLE; batch++) {
                for (let pass = 0; pass < DEDUPE_PASSES; pass++) {
                    for (const callback of callbacks) setQueue.add(callback);
                }
                benchmarkSink += setQueue.size;
                setQueue.clear();
            }
        });

        bench("Array.includes + push", () => {
            for (let batch = 0; batch < DEDUPE_BATCHES_PER_SAMPLE; batch++) {
                for (let pass = 0; pass < DEDUPE_PASSES; pass++) {
                    for (const callback of callbacks) {
                        if (!arrayQueue.includes(callback)) {
                            arrayQueue.push(callback);
                        }
                    }
                }
                benchmarkSink += arrayQueue.length;
                arrayQueue.length = 0;
            }
        });
    });
}

const typicalCallbacks = comparisonCallbacks.slice(0, 3);

for (const eventCount of DEDUPE_EVENT_COUNTS) {
    // oxlint-disable-next-line eslint/no-loop-func -- A for-of const has a fresh binding per iteration; this callback intentionally registers one benchmark group per value.
    describe(`batch callback deduplication: ${eventCount} events, 3 unique`, () => {
        const setQueue = new Set<() => void>();
        const arrayQueue: (() => void)[] = [];

        bench("Set.add", () => {
            for (let batch = 0; batch < DEDUPE_BATCHES_PER_SAMPLE; batch++) {
                for (let event = 0; event < eventCount; event++) {
                    for (const callback of typicalCallbacks) {
                        setQueue.add(callback);
                    }
                }
                benchmarkSink += setQueue.size;
                setQueue.clear();
            }
        });

        bench("Array.includes + push", () => {
            for (let batch = 0; batch < DEDUPE_BATCHES_PER_SAMPLE; batch++) {
                for (let event = 0; event < eventCount; event++) {
                    for (const callback of typicalCallbacks) {
                        if (!arrayQueue.includes(callback)) {
                            arrayQueue.push(callback);
                        }
                    }
                }
                benchmarkSink += arrayQueue.length;
                arrayQueue.length = 0;
            }
        });
    });
}

void benchmarkSink;
