import { bench } from "vitest";
import VirtualScroller from "../../models/VirtualScroller";
import { mapVirtualRange, mapVirtualRangeWithOffset } from ".";

const model = new VirtualScroller({
    estimatedItemSize: 40,
    estimatedWidgetSize: 600,
    itemCount: 100_000
});
let benchmarkSink: unknown;

bench("map the rendered range", () => {
    benchmarkSink = mapVirtualRange(model, index => index);
});

bench("map the rendered range with offsets", () => {
    benchmarkSink = mapVirtualRangeWithOffset(
        model,
        (index, offset) => index + offset
    );
});

void benchmarkSink;
