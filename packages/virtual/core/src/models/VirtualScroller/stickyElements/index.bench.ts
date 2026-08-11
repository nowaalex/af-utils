import { bench, describe } from "vitest";
import { verticalAxisAdapter } from "../../../platform/axisAdapters";
import StickyElements, { type ResizeObserverFactory } from ".";

const RESIZES_PER_SAMPLE = 10_000;
let benchmarkSink = 0.0;
let deliver: ResizeObserverCallback = () => {};

const observer = {
    observe() {},
    unobserve() {},
    disconnect() {}
} as unknown as ResizeObserver;
const factory: ResizeObserverFactory = callback => {
    deliver = callback;
    return observer;
};
const sticky = new StickyElements(
    verticalAxisAdapter,
    relativeOffset => {
        benchmarkSink += relativeOffset;
    },
    factory
);
const header = {} as HTMLElement;
const footer = {} as HTMLElement;
const headerSize = { blockSize: 20.0, inlineSize: 20.0 };
const footerSize = { blockSize: 30.0, inlineSize: 30.0 };
const entries = [
    {
        target: header,
        borderBoxSize: [headerSize]
    },
    {
        target: footer,
        borderBoxSize: [footerSize]
    }
] as unknown as ResizeObserverEntry[];

sticky._setHeader(header);
sticky._setFooter(footer);

describe("sticky element measurements", () => {
    bench("10k two-element resize deliveries", () => {
        for (let resize = 0; resize < RESIZES_PER_SAMPLE; resize++) {
            headerSize.blockSize = 20 + (resize & 1);
            footerSize.blockSize = 30 + (resize & 1);
            deliver(entries, observer);
        }
    });
});

void benchmarkSink;
