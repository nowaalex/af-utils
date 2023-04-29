import List from "./index";

describe("List creation works", () => {
    test("constructor without params works", () => {
        expect(() => new List()).not.toThrow();
    });

    test("constructor with params works", () => {
        expect(
            () =>
                new List({
                    estimatedWidgetSize: 200,
                    estimatedScrollElementOffset: 300
                })
        ).not.toThrow();
    });
});
