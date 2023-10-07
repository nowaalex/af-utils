import VirtualScroller from "./index";

describe("VirtualScroller creation works", () => {
    test("constructor without params works", () => {
        expect(() => new VirtualScroller()).not.toThrow();
    });

    test("constructor with params works", () => {
        expect(
            () =>
                new VirtualScroller({
                    estimatedWidgetSize: 200,
                    estimatedScrollElementOffset: 300
                })
        ).not.toThrow();
    });
});
