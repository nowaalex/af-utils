// @vitest-environment jsdom

import { describe, expect, test, vi } from "vitest";
import { VirtualScrollerError } from "#virtual-errors";
import TestResizeObserver from "../../__mocks__/ResizeObserver";
import { VirtualScrollerEvent } from "../../constants";
import {
    VirtualScrollerErrorCode,
    VirtualScrollerErrorIndex
} from "../../errors/codes";
import VirtualScroller from ".";

vi.useFakeTimers();

global.ResizeObserver = TestResizeObserver;

/** Scroll quiet period asserted at the native scrollbar release boundary. */
const SCROLL_IDLE_TIMEOUT_MS = 128;

describe("VirtualScroller creation works", () => {
    test("constructor without params works", () => {
        const model = new VirtualScroller();
        const explicitEmptyModel = new VirtualScroller({});

        expect(model.scrollSize).toBe(0);
        expect(model.from).toBe(0);
        expect(model.to).toBe(0);
        expect(model.visibleFrom).toBe(0);
        expect({
            from: model.from,
            scrollSize: model.scrollSize,
            to: model.to,
            visibleFrom: model.visibleFrom
        }).toEqual({
            from: explicitEmptyModel.from,
            scrollSize: explicitEmptyModel.scrollSize,
            to: explicitEmptyModel.to,
            visibleFrom: explicitEmptyModel.visibleFrom
        });
    });

    test("uses stable coded errors with detailed development messages", () => {
        let error: unknown;

        try {
            new VirtualScroller({ itemCount: -1 });
        } catch (caught) {
            error = caught;
        }

        expect(error).toBeInstanceOf(VirtualScrollerError);
        expect(error).toMatchObject({
            code: VirtualScrollerErrorCode[
                VirtualScrollerErrorIndex.INVALID_ITEM_COUNT
            ],
            name: "VirtualScrollerError"
        });
        expect((error as Error).message).toContain(
            "itemCount must be a safe integer"
        );
        expect((error as Error).message).toContain("Received: -1");
    });

    test("rejects fractional offset indexes synchronously", () => {
        const model = new VirtualScroller({ itemCount: 10 });

        expect(() => model.getOffset(0.5)).toThrowError(
            expect.objectContaining({
                code: VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_INDEX
                ]
            })
        );
    });

    test("validates a runtime update before mutating any field", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            itemCount: 10,
            overscanCount: 1
        });
        const revision = model.getRevision();
        const snapshot = {
            from: model.from,
            itemCount: model.itemCount,
            scrollSize: model.scrollSize,
            size: model.getSize(0),
            to: model.to
        };

        expect(() =>
            model.set({ estimatedItemSize: 80, itemCount: -1 })
        ).toThrowError(
            expect.objectContaining({
                code: VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_ITEM_COUNT
                ]
            })
        );
        expect(() =>
            model.set({
                estimatedItemSize: 80,
                itemCount: 20,
                overscanCount: -1
            })
        ).toThrowError(
            expect.objectContaining({
                code: VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_OVERSCAN
                ]
            })
        );

        expect(model.getRevision()).toBe(revision);
        expect({
            from: model.from,
            itemCount: model.itemCount,
            scrollSize: model.scrollSize,
            size: model.getSize(0),
            to: model.to
        }).toEqual(snapshot);
    });

    test("validates public numeric boundaries with stable error codes", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const element = document.createElement("div");
        const cases: Array<[operation: () => unknown, code: string]> = [
            [
                () => new VirtualScroller({ estimatedWidgetSize: -1 }),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_WIDGET_SIZE
                ]
            ],
            [
                () =>
                    new VirtualScroller({
                        estimatedScrollElementOffset: Number.NaN
                    }),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_SCROLLER_OFFSET
                ]
            ],
            [
                () => model.set({ estimatedItemSize: 0 }),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_ITEM_SIZE
                ]
            ],
            [
                () => model.setItemCount(1.5),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_ITEM_COUNT
                ]
            ],
            [
                () => model.getIndex(Number.POSITIVE_INFINITY),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_OFFSET
                ]
            ],
            [
                () => new VirtualScroller().getIndex(0),
                VirtualScrollerErrorCode[VirtualScrollerErrorIndex.EMPTY_MODEL]
            ],
            [
                () => model.getSize(10),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_INDEX
                ]
            ],
            [
                () => model.scrollToOffset(Number.NaN),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_OFFSET
                ]
            ],
            [
                () => model.attachItem(element, 10),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_INDEX
                ]
            ],
            [
                () => model.invalidateItemSizes(-1, 1),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_RANGE
                ]
            ],
            [
                () => model.spliceItems(9, 2, 0),
                VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.INVALID_SPLICE
                ]
            ]
        ];

        for (const [operation, code] of cases) {
            expect(operation).toThrowError(expect.objectContaining({ code }));
        }
        expect(model.itemCount).toBe(10);
        expect(model.scrollSize).toBe(400);
    });

    test("defers an isolated overscan update until a natural range update", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100,
            overscanCount: 0
        });
        const range = [model.from, model.to];
        const revision = model.getRevision(VirtualScrollerEvent.RANGE);

        model.set({ overscanCount: 20 });

        expect([model.from, model.to]).toEqual(range);
        expect(model.getRevision(VirtualScrollerEvent.RANGE)).toBe(revision);
    });

    test("invalidates and splices cached sizes with retained items", () => {
        const model = new VirtualScroller({ itemCount: 5 });
        const elements = [10, 20, 30, 40, 50].map((size, index) => {
            const element = document.createElement("div");
            element.dataset.testSize = String(size);
            model.attachItem(element, index);
            return element;
        });
        vi.advanceTimersByTime(0);
        for (const element of elements) model.detachItem(element);

        let notifications = 0;
        model.subscribe(() => notifications++);
        model.invalidateItemSizes(1, 3);
        expect(Array.from({ length: 5 }, (_, i) => model.getSize(i))).toEqual([
            10, 40, 40, 40, 50
        ]);
        expect(model.scrollSize).toBe(180);
        expect(notifications).toBe(1);

        notifications = 0;
        model.spliceItems(1, 2, 1);
        expect(model.itemCount).toBe(4);
        expect(Array.from({ length: 4 }, (_, i) => model.getSize(i))).toEqual([
            10, 40, 40, 50
        ]);
        expect(model.scrollSize).toBe(140);
        expect(notifications).toBe(1);

        model.set({ estimatedItemSize: 100 });
        expect(Array.from({ length: 4 }, (_, i) => model.getSize(i))).toEqual([
            10, 40, 40, 50
        ]);
        expect(model.scrollSize).toBe(140);

        model.spliceItems(4, 0, 1);
        expect(model.getSize(4)).toBe(100);
        expect(model.scrollSize).toBe(240);
    });

    test("preserves rendered sizes when the estimate changes", () => {
        const observe = vi.spyOn(TestResizeObserver.prototype, "observe");
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 80,
            itemCount: 5,
            overscanCount: 0
        });
        const elements = [60, 70].map((size, index) => {
            const element = document.createElement("div");
            element.dataset.testSize = String(size);
            model.attachItem(element, index);
            return element;
        });
        vi.advanceTimersByTime(0);

        model.set({ estimatedItemSize: 100 });
        expect(Array.from({ length: 5 }, (_, i) => model.getSize(i))).toEqual([
            60, 70, 100, 100, 100
        ]);
        expect(observe).toHaveBeenCalledTimes(2);

        for (const element of elements) model.detachItem(element);
        observe.mockRestore();
    });

    test("defers item observations mounted after resize publication", () => {
        const observe = vi.spyOn(TestResizeObserver.prototype, "observe");

        const model = new VirtualScroller({ itemCount: 3 });
        const first = document.createElement("div");
        const second = document.createElement("div");
        const detached = document.createElement("div");
        first.dataset.testSize = "60";
        second.dataset.testSize = "70";
        detached.dataset.testSize = "80";

        try {
            model.attachItem(first, 0);
            vi.advanceTimersByTime(0);
            model.attachItem(second, 1);
            model.attachItem(detached, 2);
            model.detachItem(detached);

            expect(observe).toHaveBeenCalledTimes(1);
            expect(model.getSize(1)).toBe(40);

            vi.advanceTimersByTime(20);

            expect(observe).toHaveBeenCalledTimes(2);
            vi.advanceTimersByTime(0);
            expect(model.getSize(1)).toBe(70);
            expect(model.getSize(2)).toBe(40);
        } finally {
            model.dispose();
            observe.mockRestore();
        }
    });

    test("cancels deferred item observation when disposed", () => {
        const observe = vi.spyOn(TestResizeObserver.prototype, "observe");

        const model = new VirtualScroller({ itemCount: 2 });
        const first = document.createElement("div");
        const second = document.createElement("div");
        first.dataset.testSize = "60";
        second.dataset.testSize = "70";
        const internals = model as unknown as {
            _itemObservationFrame: number | null;
        };

        try {
            model.attachItem(first, 0);
            vi.advanceTimersByTime(0);
            model.attachItem(second, 1);
            expect(internals._itemObservationFrame).not.toBeNull();
            model.dispose();

            expect(internals._itemObservationFrame).toBeNull();
            vi.advanceTimersByTime(20);
            expect(observe).toHaveBeenCalledTimes(1);
        } finally {
            model.dispose();
            observe.mockRestore();
        }
    });

    test("dispose is idempotent and releases observers and subscribers", () => {
        const disconnect = vi.spyOn(TestResizeObserver.prototype, "disconnect");
        const model = new VirtualScroller({ itemCount: 1 });
        const item = document.createElement("div");
        item.dataset.testSize = "50";
        const listener = vi.fn();
        model.subscribe(listener);
        model.attachItem(item, 0);

        model.dispose();
        model.dispose();
        vi.advanceTimersByTime(0);

        expect(disconnect).toHaveBeenCalledTimes(2);
        expect(() => model.setItemCount(2)).toThrowError(
            expect.objectContaining({
                code: VirtualScrollerErrorCode[
                    VirtualScrollerErrorIndex.DISPOSED
                ]
            })
        );
        expect(listener).not.toHaveBeenCalled();
        disconnect.mockRestore();
    });

    test("keeps item indexes isolated per model without DOM attributes", () => {
        const first = new VirtualScroller({ itemCount: 2 });
        const second = new VirtualScroller({ itemCount: 2 });
        const element = document.createElement("div");
        element.dataset.testSize = "80";

        first.attachItem(element, 0);
        second.attachItem(element, 1);
        vi.advanceTimersByTime(0);

        expect(first.getSize(0)).toBe(80);
        expect(first.getSize(1)).toBe(40);
        expect(second.getSize(0)).toBe(40);
        expect(second.getSize(1)).toBe(80);
        expect(element.dataset.indexX).toBeUndefined();
        expect(element.dataset.indexY).toBeUndefined();

        first.detachItem(element);
        second.detachItem(element);
    });

    test("ignores ResizeObserver entries left behind by an old range", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 0,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 200 });
        model.setScroller(scroller);

        const staleItem = document.createElement("div");
        staleItem.dataset.testSize = "80";
        model.attachItem(staleItem, 0);

        scroller.scrollTop = 2_000;
        scroller.dispatchEvent(new Event("scroll"));
        expect(model.from).toBeGreaterThan(0);
        vi.advanceTimersByTime(0);

        expect(model.getSize(0)).toBe(40);
        model.detachItem(staleItem);
        model.setScroller(null);
    });

    test("recomputes the range when the items container offset changes", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 0,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 200 });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            top: 0
        } as DOMRect);
        const container = document.createElement("div");
        vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
            top: 50
        } as DOMRect);
        const header = document.createElement("div");
        header.dataset.testSize = "50";

        model.setScroller(scroller);
        model.setContainer(container);
        model.setStickyHeader(header);
        vi.advanceTimersByTime(0);
        scroller.dispatchEvent(new Event("scroll"));
        model.set({ estimatedItemSize: 20 });

        expect(model.from).toBeGreaterThan(0);

        vi.advanceTimersByTime(256);

        expect(model.from).toBe(0);

        model.setStickyHeader(null);
        model.setContainer(null);
        model.setScroller(null);
    });

    test("publishes item-size changes whose combined delta is zero", () => {
        const model = new VirtualScroller({ itemCount: 2 });
        const first = document.createElement("div");
        const second = document.createElement("div");
        first.dataset.testSize = "30";
        second.dataset.testSize = "50";
        let sizeEvents = 0;
        let scrollSizeEvents = 0;

        model.subscribe(() => sizeEvents++, VirtualScrollerEvent.SIZES);
        model.subscribe(
            () => scrollSizeEvents++,
            VirtualScrollerEvent.SCROLL_SIZE
        );
        model.attachItem(first, 0);
        model.attachItem(second, 1);
        vi.advanceTimersByTime(0);

        expect(model.getSize(0)).toBe(30);
        expect(model.getSize(1)).toBe(50);
        expect(model.getOffset(1)).toBe(30);
        expect(model.scrollSize).toBe(80);
        expect(sizeEvents).toBe(1);
        expect(scrollSizeEvents).toBe(0);

        model.detachItem(first);
        model.detachItem(second);
    });

    test("publishes growing scroll size after the scroll transaction", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 50_000
        });
        const scroller = Object.assign(new EventTarget(), {
            clientHeight: 200,
            scrollTop: 1_999_800,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        }) as unknown as HTMLElement;
        let scrollSizeEvents = 0;
        let scrollTopAtNotification = 0;

        model.subscribe(() => {
            scrollSizeEvents++;
            scrollTopAtNotification = scroller.scrollTop;
        }, VirtualScrollerEvent.SCROLL_SIZE);
        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));

        const item = document.createElement("div");
        item.dataset.testSize = "80";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(2_000_000);
        expect(scrollSizeEvents).toBe(0);
        vi.advanceTimersByTime(SCROLL_IDLE_TIMEOUT_MS);

        expect(model.scrollSize).toBe(2_000_040);
        expect(scrollSizeEvents).toBe(1);
        expect(scroller.scrollTop).toBe(1_999_840);
        // DOM subscribers must publish the new scroll extent before the
        // correction can move the native scrollbar to that new maximum.
        expect(scrollTopAtNotification).toBe(1_999_800);
        expect(model.to).toBe(50_000);

        model.setScroller(null);
    });

    test("publishes shrinking scroll size after the scroll transaction", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 80,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            scrollTop: { value: 7_800, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        let scrollSizeEvents = 0;

        model.subscribe(
            () => scrollSizeEvents++,
            VirtualScrollerEvent.SCROLL_SIZE
        );
        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));

        const item = document.createElement("div");
        item.dataset.testSize = "40";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(8_000);
        expect(scrollSizeEvents).toBe(0);
        scroller.dispatchEvent(new Event("scrollend"));

        expect(model.scrollSize).toBe(7_960);
        expect(scrollSizeEvents).toBe(1);
        expect(scroller.scrollTop).toBe(7_760);

        model.setScroller(null);
    });

    test("keeps geometry frozen while a primary pointer is held", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            clientLeft: { value: 0 },
            clientWidth: { value: 80 },
            scrollTop: { value: 3_800, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        const pointerDown = new Event("pointerdown");
        const pointerUp = new Event("pointerup");
        Object.defineProperty(pointerDown, "isPrimary", { value: true });
        Object.defineProperty(pointerDown, "clientX", { value: 90 });
        Object.defineProperty(pointerUp, "isPrimary", { value: true });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            left: 0,
            right: 100
        } as DOMRect);

        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));
        scroller.dispatchEvent(pointerDown);

        const item = document.createElement("div");
        item.dataset.testSize = "80";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(4_000);
        expect(model.getSize(model.from)).toBe(80);
        expect(scroller.scrollTop).toBe(3_800);

        vi.advanceTimersByTime(SCROLL_IDLE_TIMEOUT_MS);
        expect(model.scrollSize).toBe(4_000);

        window.dispatchEvent(pointerUp);
        expect(model.scrollSize).toBe(4_040);
        expect(scroller.scrollTop).toBe(3_840);
        scroller.dispatchEvent(new Event("scrollend"));
        expect(model.scrollSize).toBe(4_040);

        model.setScroller(null);
    });

    test("updates the items-container offset when the transaction ends", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            clientLeft: { value: 0 },
            clientWidth: { value: 80 },
            scrollTop: { value: 3_850, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        vi.spyOn(scroller, "getBoundingClientRect").mockImplementation(
            () =>
                ({
                    left: 0,
                    right: 100,
                    top: 0
                }) as DOMRect
        );
        const container = document.createElement("div");
        vi.spyOn(container, "getBoundingClientRect").mockImplementation(
            () => ({ top: 50 - scroller.scrollTop }) as DOMRect
        );
        const pointerDown = new Event("pointerdown");
        const pointerUp = new Event("pointerup");
        Object.defineProperties(pointerDown, {
            clientX: { value: 90 },
            isPrimary: { value: true }
        });
        Object.defineProperty(pointerUp, "isPrimary", { value: true });

        model.setScroller(scroller);
        model.setContainer(container);
        scroller.dispatchEvent(new Event("scroll"));
        scroller.dispatchEvent(pointerDown);

        const item = document.createElement("div");
        item.dataset.testSize = "80";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(4_000);
        expect(scroller.scrollTop).toBe(3_850);
        window.dispatchEvent(pointerUp);

        expect(model.scrollSize).toBe(4_040);
        expect(scroller.scrollTop).toBe(3_890);
        scroller.dispatchEvent(new Event("scrollend"));
        expect(model.scrollSize).toBe(4_040);
        expect(scroller.scrollTop).toBe(3_890);

        model.detachItem(item);
        model.setContainer(null);
        model.setScroller(null);
    });

    test("publishes item-count geometry when the transaction ends", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            clientLeft: { value: 0 },
            clientWidth: { value: 80 },
            scrollTop: { value: 3_800, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            left: 0,
            right: 100
        } as DOMRect);
        const pointerDown = new Event("pointerdown");
        const pointerUp = new Event("pointerup");
        Object.defineProperties(pointerDown, {
            clientX: { value: 90 },
            isPrimary: { value: true }
        });
        Object.defineProperty(pointerUp, "isPrimary", { value: true });

        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));
        scroller.dispatchEvent(pointerDown);

        model.setItemCount(110);

        expect(model.itemCount).toBe(110);
        expect(model.scrollSize).toBe(4_000);
        expect(model.to).toBe(110);
        expect(scroller.scrollTop).toBe(3_800);

        window.dispatchEvent(pointerUp);
        expect(model.scrollSize).toBe(4_400);
        expect(scroller.scrollTop).toBe(4_200);
        scroller.dispatchEvent(new Event("scrollend"));
        expect(model.scrollSize).toBe(4_400);

        model.setScroller(null);
    });

    test("publishes measurements that return to the estimated size", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            clientLeft: { value: 0 },
            clientWidth: { value: 80 },
            scrollTop: { value: 3_800, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            left: 0,
            right: 100
        } as DOMRect);
        const pointerDown = new Event("pointerdown");
        const pointerUp = new Event("pointerup");
        Object.defineProperties(pointerDown, {
            clientX: { value: 90 },
            isPrimary: { value: true }
        });
        Object.defineProperty(pointerUp, "isPrimary", { value: true });

        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));
        scroller.dispatchEvent(pointerDown);

        const item = document.createElement("div");
        item.dataset.testSize = "80";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(4_000);
        expect(scroller.scrollTop).toBe(3_800);

        vi.advanceTimersByTime(20);
        item.dataset.testSize = "40";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(4_000);
        expect(scroller.scrollTop).toBe(3_800);

        window.dispatchEvent(pointerUp);
        vi.runOnlyPendingTimers();
        expect(model.scrollSize).toBe(4_000);
        expect(scroller.scrollTop).toBe(3_800);

        model.detachItem(item);
        model.setScroller(null);
    });

    test("tracks revisions for combined event masks", () => {
        const model = new VirtualScroller({ itemCount: 10 });
        const events =
            VirtualScrollerEvent.RANGE | VirtualScrollerEvent.SCROLL_SIZE;
        const before = model.getRevision(events);
        let calls = 0;
        const unsubscribe = model.subscribe(() => calls++, events);

        model.setItemCount(20);

        expect(model.getRevision(events)).toBeGreaterThan(before);
        expect(calls).toBe(1);
        unsubscribe();
        model.setItemCount(30);
        expect(calls).toBe(1);
    });

    test("keeps the current dispatch stable when a listener unsubscribes", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 0,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 200 });
        model.setScroller(scroller);

        const calls: string[] = [];
        let unsubscribeSecond = () => {};

        model.subscribe(() => calls.push("first"), VirtualScrollerEvent.RANGE);
        unsubscribeSecond = model.subscribe(() => {
            calls.push("second");
            unsubscribeSecond();
        }, VirtualScrollerEvent.RANGE);
        model.subscribe(() => calls.push("third"), VirtualScrollerEvent.RANGE);

        scroller.scrollTop = 2_000;
        scroller.dispatchEvent(new Event("scroll"));
        expect(calls).toEqual(["first", "second", "third"]);

        calls.length = 0;
        scroller.scrollTop = 0;
        scroller.dispatchEvent(new Event("scroll"));
        expect(calls).toEqual(["first", "third"]);

        // Repeated unsubscription is a no-op and must not remove a neighbour.
        unsubscribeSecond();
        calls.length = 0;
        scroller.scrollTop = 2_000;
        scroller.dispatchEvent(new Event("scroll"));
        expect(calls).toEqual(["first", "third"]);

        model.setScroller(null);
    });

    test("tracks fallback and native scroll completion separately", () => {
        const createScroller = (nativeScrollEnd: boolean) => {
            const target = nativeScrollEnd
                ? document.createElement("div")
                : new EventTarget();
            const scroller = Object.assign(target, {
                scrollTop: 0,
                scroll({ top }: ScrollToOptions) {
                    this.scrollTop = top ?? this.scrollTop;
                }
            }) as HTMLElement;
            Object.defineProperty(scroller, "clientHeight", { value: 200 });
            if (nativeScrollEnd) {
                Object.defineProperty(scroller, "onscrollend", { value: null });
            }
            return scroller;
        };
        const isScrollActive = (model: VirtualScroller) =>
            (
                model as unknown as {
                    _scrollActivity: {
                        _nativeScrollActive: boolean;
                    };
                }
            )._scrollActivity._nativeScrollActive;

        const fallbackModel = new VirtualScroller({ itemCount: 100 });
        const fallbackScroller = createScroller(false);
        fallbackModel.setScroller(fallbackScroller);
        fallbackScroller.dispatchEvent(new Event("scroll"));
        expect(isScrollActive(fallbackModel)).toBe(true);
        vi.advanceTimersByTime(SCROLL_IDLE_TIMEOUT_MS - 1);
        expect(isScrollActive(fallbackModel)).toBe(true);
        vi.advanceTimersByTime(1);
        expect(isScrollActive(fallbackModel)).toBe(false);
        fallbackModel.setScroller(null);

        const nativeModel = new VirtualScroller({ itemCount: 100 });
        const nativeScroller = createScroller(true);
        nativeModel.setScroller(nativeScroller);
        nativeScroller.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(SCROLL_IDLE_TIMEOUT_MS);
        expect(isScrollActive(nativeModel)).toBe(true);
        nativeScroller.dispatchEvent(new Event("scrollend"));
        expect(isScrollActive(nativeModel)).toBe(false);
        nativeModel.setScroller(null);
    });

    test("keeps programmatic state only while scrollToIndex is converging", () => {
        const model = new VirtualScroller({ itemCount: 100 });
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 0,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 200 });
        model.setScroller(scroller);

        const internals = model as unknown as {
            _scrollActivity: {
                _programmaticScrollActive: boolean;
                _onNativeScrollEnd(): void;
            };
        };
        model.scrollToOffset(40);
        expect(internals._scrollActivity._programmaticScrollActive).toBe(true);
        internals._scrollActivity._onNativeScrollEnd();
        expect(internals._scrollActivity._programmaticScrollActive).toBe(false);

        model.scrollToIndex(10, true, 2);
        expect(internals._scrollActivity._programmaticScrollActive).toBe(true);
        internals._scrollActivity._onNativeScrollEnd();
        expect(internals._scrollActivity._programmaticScrollActive).toBe(true);

        model.setScroller(null);
    });

    test("publishes deferred geometry on pointerup before native scrollend", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            clientLeft: { value: 0 },
            clientWidth: { value: 80 },
            onscrollend: { value: null },
            scrollTop: { value: 3_800, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            left: 0,
            right: 100
        } as DOMRect);
        const pointerDown = new Event("pointerdown");
        const pointerUp = new Event("pointerup");
        Object.defineProperties(pointerDown, {
            clientX: { value: 90 },
            isPrimary: { value: true }
        });
        Object.defineProperty(pointerUp, "isPrimary", { value: true });

        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));
        scroller.dispatchEvent(pointerDown);

        const item = document.createElement("div");
        item.dataset.testSize = "80";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);
        vi.advanceTimersByTime(SCROLL_IDLE_TIMEOUT_MS);

        window.dispatchEvent(pointerUp);
        expect(model.scrollSize).toBe(4_040);
        expect(scroller.scrollTop).toBe(3_840);

        scroller.dispatchEvent(new Event("scrollend"));
        expect(model.scrollSize).toBe(4_040);
        expect(scroller.scrollTop).toBe(3_840);

        model.detachItem(item);
        model.setScroller(null);
    });

    test("does not rescale an arbitrary offset when measured sizes change", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            onscrollend: { value: null },
            scrollTop: { value: 1_900, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        let scrollSizeEvents = 0;

        model.subscribe(
            () => scrollSizeEvents++,
            VirtualScrollerEvent.SCROLL_SIZE
        );
        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));

        const item = document.createElement("div");
        item.dataset.testSize = "80";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(4_000);
        expect(scrollSizeEvents).toBe(0);
        expect(scroller.scrollTop).toBe(1_900);

        scroller.dispatchEvent(new Event("scrollend"));
        expect(model.scrollSize).toBe(4_040);
        expect(scrollSizeEvents).toBe(1);
        vi.advanceTimersByTime(20);

        const secondItem = document.createElement("div");
        secondItem.dataset.testSize = "80";
        model.attachItem(secondItem, model.from + 1);
        vi.advanceTimersByTime(0);

        expect(model.scrollSize).toBe(4_080);
        expect(scrollSizeEvents).toBe(2);
        expect(scroller.scrollTop).toBe(1_900);

        model.setScroller(null);
    });

    test("does not turn runtime parameter updates into implicit scrolling", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            scrollTop: { value: 1_900, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });
        let scrollSizeEvents = 0;

        model.subscribe(
            () => scrollSizeEvents++,
            VirtualScrollerEvent.SCROLL_SIZE
        );
        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));
        const preservedCount = model.to - model.from;

        model.set({ estimatedItemSize: 80, itemCount: 200 });

        expect(model.scrollSize).toBe(4_000);
        expect(scrollSizeEvents).toBe(0);
        scroller.dispatchEvent(new Event("scrollend"));

        expect(model.scrollSize).toBe(200 * 80 - preservedCount * (80 - 40));
        expect(scrollSizeEvents).toBe(1);
        expect(scroller.scrollTop).toBe(1_900);

        model.setScroller(null);
    });

    test("preserves the idle item anchor when a new estimate resets sizes", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            scrollTop: { value: 1_900, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });

        model.setScroller(scroller);
        const anchorIndex = model.getIndex(scroller.scrollTop);
        const anchorViewportOffset =
            model.getOffset(anchorIndex) - scroller.scrollTop;
        const preservedCount = model.to - model.from;

        model.set({ estimatedItemSize: 80 });

        expect(model.scrollSize).toBe(100 * 80 - preservedCount * (80 - 40));
        expect(model.getIndex(scroller.scrollTop)).toBe(anchorIndex);
        expect(model.getOffset(anchorIndex) - scroller.scrollTop).toBe(
            anchorViewportOffset
        );

        model.setScroller(null);
    });

    test("keeps an idle end-aligned viewport at the end after an estimate reset", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            scrollTop: { value: 3_800, writable: true },
            scroll: {
                value: ({ top }: ScrollToOptions) => {
                    scroller.scrollTop = top ?? scroller.scrollTop;
                }
            }
        });

        model.setScroller(scroller);
        const preservedCount = model.to - model.from;
        model.set({ estimatedItemSize: 80, itemCount: 200 });

        const expectedScrollSize = 200 * 80 - preservedCount * (80 - 40);
        expect(model.scrollSize).toBe(expectedScrollSize);
        expect(scroller.scrollTop).toBe(expectedScrollSize - 200);

        model.setScroller(null);
    });

    test("includes the items container offset when scrolling to the end", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedScrollElementOffset: 100,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        let targetOffset = 0;
        const scroller = Object.assign(new EventTarget(), {
            clientHeight: 200,
            scrollTop: 0,
            scroll({ top }: ScrollToOptions) {
                targetOffset = top ?? targetOffset;
            }
        }) as unknown as HTMLElement;

        model.setScroller(scroller);
        model.scrollToOffset(model.scrollSize);

        expect(targetOffset).toBe(3_900);

        model.setScroller(null);
    });

    test("does not let measurements cancel a pending smooth scroll", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const calls: ScrollToOptions[] = [];
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 3_800,
            scroll(options: ScrollToOptions) {
                calls.push(options);
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 200 });

        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));
        model.scrollToOffset(1_000, true);

        const item = document.createElement("div");
        item.dataset.testSize = "80";
        model.attachItem(item, model.from);
        vi.advanceTimersByTime(0);

        expect(calls).toEqual([{ top: 1_000, behavior: "smooth" }]);
        model.setScroller(null);
    });

    test("validates scrollToIndex arguments synchronously", () => {
        const model = new VirtualScroller({ itemCount: 10 });

        expect(() => model.scrollToIndex(-1)).toThrow(VirtualScrollerError);
        expect(() => model.scrollToIndex(10)).toThrow(VirtualScrollerError);
        expect(() => model.scrollToIndex(1, false, 0)).toThrow(
            VirtualScrollerError
        );
    });

    test("positions scrollToIndex targets below a sticky header", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedScrollElementOffset: 100,
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        let targetOffset = 0;
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 0,
            scroll({ top }: ScrollToOptions) {
                targetOffset = top ?? targetOffset;
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 240 });
        const header = document.createElement("div");
        header.dataset.testSize = "40";

        model.setScroller(scroller);
        model.setStickyHeader(header);
        vi.advanceTimersByTime(0);
        model.scrollToIndex(25, false, 1);
        vi.advanceTimersByTime(16);

        expect(targetOffset).toBe(1_060);

        model.setStickyHeader(null);
        model.setScroller(null);
    });

    test("keeps CSS-sticky headers native while observing their size", () => {
        const model = new VirtualScroller({
            estimatedWidgetSize: 200,
            itemCount: 100
        });
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 0,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 200 });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({
            top: 0
        } as DOMRect);
        const header = document.createElement("div");
        header.style.position = "sticky";
        header.style.top = "0px";
        vi.spyOn(header, "getBoundingClientRect").mockReturnValue({
            top: 0
        } as DOMRect);

        model.setScroller(scroller);
        model.setStickyHeader(header);

        expect(header.style.position).toBe("sticky");
        expect(header.style.zIndex).toBe("1");
        scroller.scrollTop = 120;
        scroller.dispatchEvent(new Event("scroll"));
        expect(header.style.top).toBe("0px");

        model.setStickyHeader(null);
        expect(header.style.position).toBe("sticky");
        expect(header.style.top).toBe("0px");
        expect(header.style.zIndex).toBe("");
        model.setScroller(null);
    });

    test("preserves the end when a sticky footer is measured late", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 10
        });
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 200,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        });
        Object.defineProperty(scroller, "clientHeight", { value: 200 });
        const footer = document.createElement("div");
        footer.dataset.testSize = "50";

        model.setScroller(scroller);
        scroller.dispatchEvent(new Event("scroll"));
        model.setStickyFooter(footer);
        vi.advanceTimersByTime(0);

        expect(scroller.scrollTop).toBe(250);
        expect(model.to).toBe(model.itemCount);

        model.setStickyFooter(null);
        model.setScroller(null);
    });

    test("preserves the end when the items container offset is measured late", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 40,
            estimatedWidgetSize: 200,
            itemCount: 10
        });
        const scroller = Object.assign(document.createElement("div"), {
            scrollTop: 200,
            scroll({ top }: ScrollToOptions) {
                this.scrollTop = top ?? this.scrollTop;
            }
        });
        const container = document.createElement("div");
        Object.defineProperties(scroller, {
            clientHeight: { value: 200 },
            getBoundingClientRect: {
                value: () => ({ top: 0 })
            }
        });
        Object.defineProperty(container, "getBoundingClientRect", {
            value: () => ({ top: -160 })
        });

        model.setScroller(scroller);
        model.setContainer(container);
        vi.advanceTimersByTime(256);

        expect(scroller.scrollTop).toBe(240);
        expect(model.to).toBe(model.itemCount);

        model.setContainer(null);
        model.setScroller(null);
    });

    test("constructor with params works", () => {
        const model = new VirtualScroller({
            estimatedItemSize: 220,
            estimatedWidgetSize: 600,
            itemCount: 100,
            overscanCount: 0
        });
        expect(model.scrollSize).toBe(22000);
        expect(model.from).toBe(0);
        expect(model.to).toBe(3);
    });

    describe("sizes calculations work", () => {
        const pseudoRandomSizes = Array.from(
            { length: 256 },
            (_, i) => 45 + ((i ** 4) & 127)
        );

        const pseudoRandomSizesSum = pseudoRandomSizes.reduce(
            (acc, v) => acc + v
        );

        const model = new VirtualScroller({
            estimatedWidgetSize: pseudoRandomSizesSum,
            itemCount: pseudoRandomSizes.length
        });

        for (let i = 0; i < pseudoRandomSizes.length; i++) {
            const el = document.createElement("div");
            el.dataset.testSize = "" + pseudoRandomSizes[i];
            model.attachItem(el, i);
        }

        vi.runAllTimers();

        const getIndexNaive = (offset: number) => {
            let i = -1;

            do {
                offset -= model.getSize(++i);
            } while (offset > 0);

            return i;
        };

        const getOffsetNaive = (index: number) => {
            let offset = 0;

            for (let i = 0; i < index; i++) {
                offset += model.getSize(i);
            }

            return offset;
        };

        test("scrollSize works", () => {
            expect(model.scrollSize).toBe(pseudoRandomSizesSum);
        });

        test("getSize works for every measured item", () => {
            for (let index = 0; index < pseudoRandomSizes.length; index++) {
                expect(model.getSize(index), `getSize(${index})`).toBe(
                    pseudoRandomSizes[index]
                );
            }
        });

        test("getOffset works for every measured item", () => {
            for (let index = 0; index < pseudoRandomSizes.length; index++) {
                expect(model.getOffset(index), `getOffset(${index})`).toBe(
                    getOffsetNaive(index)
                );
            }
        });

        test("getIndex works across the measured offset range", () => {
            for (let offset = 0; offset < pseudoRandomSizes.length; offset++) {
                expect(model.getIndex(offset), `getIndex(${offset})`).toBe(
                    getIndexNaive(offset)
                );
            }
        });
    });
});
