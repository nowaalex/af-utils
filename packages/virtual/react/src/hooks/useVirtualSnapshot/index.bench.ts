import { VirtualScroller, VirtualScrollerEvent } from "@af-utils/virtual-core";
import { bench, describe } from "vitest";

const model = new VirtualScroller({ itemCount: 100_000 });
let benchmarkSink: number | string = 0;

describe("external-store snapshot revisions", () => {
    bench("numeric event revision", () => {
        benchmarkSink = model.getRevision(VirtualScrollerEvent.ALL);
    });

    bench("legacy allocated string snapshot", () => {
        benchmarkSink = `${model.from};${model.to};${model.scrollSize}`;
    });
});

void benchmarkSink;
