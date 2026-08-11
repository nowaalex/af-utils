import { describe, expect, test, vi } from "vitest";
import { VirtualScrollerEvent } from "../../../constants";
import VirtualScrollerEvents from ".";

describe("VirtualScrollerEvents", () => {
    test("publishes revisions for the selected event masks", () => {
        const events = new VirtualScrollerEvents();
        const rangeBefore = events.getRevision(VirtualScrollerEvent.RANGE);
        const sizesBefore = events.getRevision(VirtualScrollerEvent.SIZES);

        events.emit(VirtualScrollerEvent.RANGE);

        expect(events.getRevision(VirtualScrollerEvent.RANGE)).toBeGreaterThan(
            rangeBefore
        );
        expect(events.getRevision(VirtualScrollerEvent.SIZES)).toBe(
            sizesBefore
        );
    });

    test("returns the newest revision in a combined mask", () => {
        const events = new VirtualScrollerEvents();

        events.emit(VirtualScrollerEvent.SIZES);
        const sizesRevision = events.getRevision(VirtualScrollerEvent.SIZES);
        events.emit(VirtualScrollerEvent.SCROLL_SIZE);
        const scrollSizeRevision = events.getRevision(
            VirtualScrollerEvent.SCROLL_SIZE
        );

        expect(scrollSizeRevision).toBeGreaterThan(sizesRevision);
        expect(
            events.getRevision(
                VirtualScrollerEvent.SCROLL_SIZE | VirtualScrollerEvent.SIZES
            )
        ).toBe(scrollSizeRevision);
        expect(events.getRevision(VirtualScrollerEvent.SIZES)).toBe(
            sizesRevision
        );

        events.emit(VirtualScrollerEvent.SIZES);
        const newestSizesRevision = events.getRevision(
            VirtualScrollerEvent.SIZES
        );

        expect(
            events.getRevision(
                VirtualScrollerEvent.SCROLL_SIZE | VirtualScrollerEvent.SIZES
            )
        ).toBe(newestSizesRevision);

        events.emit(VirtualScrollerEvent.RANGE);
        const rangeRevision = events.getRevision(VirtualScrollerEvent.RANGE);

        expect(
            events.getRevision(
                VirtualScrollerEvent.RANGE | VirtualScrollerEvent.SCROLL_SIZE
            )
        ).toBe(rangeRevision);
    });

    test("subscribes and unsubscribes each event mask independently", () => {
        const events = new VirtualScrollerEvents();
        const range = vi.fn();
        const scrollSize = vi.fn();
        const sizes = vi.fn();
        const unsubscribeRange = events.subscribe(
            range,
            VirtualScrollerEvent.RANGE
        );
        const unsubscribeScrollSize = events.subscribe(
            scrollSize,
            VirtualScrollerEvent.SCROLL_SIZE
        );
        const unsubscribeSizes = events.subscribe(
            sizes,
            VirtualScrollerEvent.SIZES
        );

        events.emit(VirtualScrollerEvent.RANGE);
        expect(range).toHaveBeenCalledOnce();
        expect(scrollSize).not.toHaveBeenCalled();
        expect(sizes).not.toHaveBeenCalled();

        events.emit(VirtualScrollerEvent.SCROLL_SIZE);
        expect(scrollSize).toHaveBeenCalledOnce();
        expect(sizes).not.toHaveBeenCalled();

        events.emit(VirtualScrollerEvent.SIZES);
        expect(sizes).toHaveBeenCalledOnce();

        unsubscribeRange();
        unsubscribeScrollSize();
        unsubscribeSizes();
        events.emit(VirtualScrollerEvent.RANGE);
        events.emit(VirtualScrollerEvent.SCROLL_SIZE);
        events.emit(VirtualScrollerEvent.SIZES);

        expect(range).toHaveBeenCalledOnce();
        expect(scrollSize).toHaveBeenCalledOnce();
        expect(sizes).toHaveBeenCalledOnce();
    });

    test("keeps separately subscribed masks when the same callback is unsubscribed", () => {
        const masks = [
            VirtualScrollerEvent.RANGE,
            VirtualScrollerEvent.SCROLL_SIZE,
            VirtualScrollerEvent.SIZES
        ];

        for (const removedMask of masks) {
            const events = new VirtualScrollerEvents();
            const listener = vi.fn();
            const unsubscribes = masks.map(mask =>
                events.subscribe(listener, mask)
            );

            unsubscribes[masks.indexOf(removedMask)]!();
            for (const emittedMask of masks) events.emit(emittedMask);

            expect(listener).toHaveBeenCalledTimes(2);
        }
    });

    test("coalesces callbacks across events and nested batches", () => {
        const events = new VirtualScrollerEvents();
        const listener = vi.fn();

        events.subscribe(listener, VirtualScrollerEvent.ALL);
        events.beginBatch();
        events.emit(VirtualScrollerEvent.RANGE);
        events.beginBatch();
        events.emit(VirtualScrollerEvent.SCROLL_SIZE);
        events.emit(VirtualScrollerEvent.RANGE);
        events.endBatch();

        expect(listener).not.toHaveBeenCalled();

        events.endBatch();

        expect(listener).toHaveBeenCalledOnce();
    });

    test("publishes one shared revision when the outer batch ends", () => {
        const events = new VirtualScrollerEvents();
        const rangeBefore = events.getRevision(VirtualScrollerEvent.RANGE);
        const sizesBefore = events.getRevision(VirtualScrollerEvent.SIZES);

        events.beginBatch();
        events.emit(VirtualScrollerEvent.RANGE);
        events.emit(VirtualScrollerEvent.SIZES);

        expect(events.getRevision(VirtualScrollerEvent.RANGE)).toBe(
            rangeBefore
        );
        expect(events.getRevision(VirtualScrollerEvent.SIZES)).toBe(
            sizesBefore
        );

        events.endBatch();

        const rangeAfter = events.getRevision(VirtualScrollerEvent.RANGE);
        expect(rangeAfter).toBeGreaterThan(rangeBefore);
        expect(events.getRevision(VirtualScrollerEvent.SIZES)).toBe(rangeAfter);
    });

    test("publishes batched revisions only for emitted event categories", () => {
        const masks = [
            VirtualScrollerEvent.RANGE,
            VirtualScrollerEvent.SCROLL_SIZE,
            VirtualScrollerEvent.SIZES
        ];

        for (const emitted of masks) {
            const events = new VirtualScrollerEvents();
            events.beginBatch();
            events.emit(emitted);
            events.endBatch();

            for (const selected of masks) {
                expect(events.getRevision(selected)).toBe(
                    selected === emitted ? 1 : 0
                );
            }
        }
    });

    test("treats separate subscriptions of one callback independently", () => {
        const events = new VirtualScrollerEvents();
        const listener = vi.fn();

        events.subscribe(listener, VirtualScrollerEvent.RANGE);
        events.subscribe(listener, VirtualScrollerEvent.SIZES);
        events.beginBatch();
        events.emit(VirtualScrollerEvent.RANGE);
        events.emit(VirtualScrollerEvent.SIZES);
        events.endBatch();

        expect(listener).toHaveBeenCalledTimes(2);
    });

    test("runs the outer batch hook after notifying subscribers", () => {
        const calls: string[] = [];
        const events = new VirtualScrollerEvents(() => calls.push("after"));

        events.subscribe(
            () => calls.push("listener"),
            VirtualScrollerEvent.ALL
        );
        events.beginBatch();
        events.emit(VirtualScrollerEvent.RANGE);
        events.beginBatch();
        events.emit(VirtualScrollerEvent.SIZES);
        events.endBatch();

        expect(calls).toEqual([]);

        events.endBatch();

        expect(calls).toEqual(["listener", "after"]);
    });

    test("uses the subscriptions present when a batch is flushed", () => {
        const events = new VirtualScrollerEvents();
        const first = vi.fn();
        const second = vi.fn();
        const unsubscribeFirst = events.subscribe(
            first,
            VirtualScrollerEvent.RANGE
        );

        events.beginBatch();
        events.emit(VirtualScrollerEvent.RANGE);
        unsubscribeFirst();
        events.subscribe(second, VirtualScrollerEvent.RANGE);
        events.endBatch();

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });

    test("keeps an active dispatch stable during reentrant unsubscription", () => {
        const events = new VirtualScrollerEvents();
        const calls: string[] = [];
        let unsubscribeSecond = () => {};

        events.subscribe(() => calls.push("first"), VirtualScrollerEvent.RANGE);
        unsubscribeSecond = events.subscribe(() => {
            calls.push("second");
            unsubscribeSecond();
        }, VirtualScrollerEvent.RANGE);
        events.subscribe(() => calls.push("third"), VirtualScrollerEvent.RANGE);

        events.emit(VirtualScrollerEvent.RANGE);
        expect(calls).toEqual(["first", "second", "third"]);

        calls.length = 0;
        events.emit(VirtualScrollerEvent.RANGE);
        expect(calls).toEqual(["first", "third"]);
    });

    test("keeps batches isolated between dispatcher instances", () => {
        const firstEvents = new VirtualScrollerEvents();
        const secondEvents = new VirtualScrollerEvents();
        const first = vi.fn();
        const second = vi.fn();

        firstEvents.subscribe(first, VirtualScrollerEvent.RANGE);
        secondEvents.subscribe(second, VirtualScrollerEvent.RANGE);

        firstEvents.beginBatch();
        firstEvents.emit(VirtualScrollerEvent.RANGE);
        secondEvents.emit(VirtualScrollerEvent.RANGE);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();

        firstEvents.endBatch();
        expect(first).toHaveBeenCalledOnce();
    });

    test("finishes the batch and runs its hook when a subscriber throws", () => {
        const afterBatch = vi.fn();
        const events = new VirtualScrollerEvents(afterBatch);
        const unsubscribe = events.subscribe(() => {
            throw new Error("listener failed");
        }, VirtualScrollerEvent.RANGE);
        events.beginBatch();
        events.emit(VirtualScrollerEvent.RANGE);

        expect(() => events.endBatch()).toThrow("listener failed");
        expect(afterBatch).toHaveBeenCalledOnce();

        unsubscribe();
        const listener = vi.fn();
        events.subscribe(listener, VirtualScrollerEvent.RANGE);
        events.emit(VirtualScrollerEvent.RANGE);
        expect(listener).toHaveBeenCalledOnce();
    });

    test("rejects an unmatched endBatch call", () => {
        const events = new VirtualScrollerEvents();

        expect(() => events.endBatch()).toThrow(
            "Cannot end an event batch that was not started"
        );
    });
});
