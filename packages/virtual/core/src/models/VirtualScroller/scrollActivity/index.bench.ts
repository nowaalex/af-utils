import { bench, describe } from "vitest";
import ScrollActivity, { type ScrollActivityScheduler } from ".";

const TRANSITIONS_PER_SAMPLE = 10_000;
let currentTime = 0;
let benchmarkSink = 0;

const scheduler: ScrollActivityScheduler = {
    _now: () => ++currentTime,
    _setTimeout: () => 1 as unknown as ReturnType<typeof setTimeout>,
    _clearTimeout: () => {}
};
const activity = new ScrollActivity(() => benchmarkSink++, scheduler);

describe("scroll activity transitions", () => {
    bench("10k native-scroll transitions", () => {
        activity._setNativeScrollEndSupported(true);

        for (
            let transition = 0;
            transition < TRANSITIONS_PER_SAMPLE;
            transition++
        ) {
            activity._onNativeScroll();
            activity._onNativeScrollEnd();
        }
    });

    bench("10k fallback-scroll transitions", () => {
        activity._setNativeScrollEndSupported(false);

        for (
            let transition = 0;
            transition < TRANSITIONS_PER_SAMPLE;
            transition++
        ) {
            activity._onNativeScroll();
        }
    });
});

void benchmarkSink;
