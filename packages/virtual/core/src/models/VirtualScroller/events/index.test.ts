import { describe, expect, test, vi } from "vitest";
import { VirtualScrollerEvent } from "../../../constants";
import VirtualScrollerEvents from ".";

const noop = () => {};

describe("VirtualScrollerEvents", () => {
    test("publishes revisions for the selected event masks", () => {
        const events = new VirtualScrollerEvents();
        const rangeBefore = events._getRevision(VirtualScrollerEvent.RANGE);
        const sizesBefore = events._getRevision(VirtualScrollerEvent.SIZES);

        events._emit(VirtualScrollerEvent.RANGE);

        expect(events._getRevision(VirtualScrollerEvent.RANGE)).toBeGreaterThan(
            rangeBefore
        );
        expect(events._getRevision(VirtualScrollerEvent.SIZES)).toBe(
            sizesBefore
        );
    });

    test("returns the newest revision in a combined mask", () => {
        const events = new VirtualScrollerEvents();

        events._emit(VirtualScrollerEvent.SIZES);
        const sizesRevision = events._getRevision(VirtualScrollerEvent.SIZES);
        events._emit(VirtualScrollerEvent.SCROLL_SIZE);
        const scrollSizeRevision = events._getRevision(
            VirtualScrollerEvent.SCROLL_SIZE
        );

        expect(scrollSizeRevision).toBeGreaterThan(sizesRevision);
        expect(
            events._getRevision(
                VirtualScrollerEvent.SCROLL_SIZE | VirtualScrollerEvent.SIZES
            )
        ).toBe(scrollSizeRevision);
        expect(events._getRevision(VirtualScrollerEvent.SIZES)).toBe(
            sizesRevision
        );

        events._emit(VirtualScrollerEvent.SIZES);
        const newestSizesRevision = events._getRevision(
            VirtualScrollerEvent.SIZES
        );

        expect(
            events._getRevision(
                VirtualScrollerEvent.SCROLL_SIZE | VirtualScrollerEvent.SIZES
            )
        ).toBe(newestSizesRevision);

        events._emit(VirtualScrollerEvent.RANGE);
        const rangeRevision = events._getRevision(VirtualScrollerEvent.RANGE);

        expect(
            events._getRevision(
                VirtualScrollerEvent.RANGE | VirtualScrollerEvent.SCROLL_SIZE
            )
        ).toBe(rangeRevision);
    });

    test("subscribes and unsubscribes each event mask independently", () => {
        const events = new VirtualScrollerEvents();
        const range = vi.fn();
        const scrollSize = vi.fn();
        const sizes = vi.fn();
        const unsubscribeRange = events._subscribe(
            range,
            VirtualScrollerEvent.RANGE
        );
        const unsubscribeScrollSize = events._subscribe(
            scrollSize,
            VirtualScrollerEvent.SCROLL_SIZE
        );
        const unsubscribeSizes = events._subscribe(
            sizes,
            VirtualScrollerEvent.SIZES
        );

        events._emit(VirtualScrollerEvent.RANGE);
        expect(range).toHaveBeenCalledOnce();
        expect(scrollSize).not.toHaveBeenCalled();
        expect(sizes).not.toHaveBeenCalled();

        events._emit(VirtualScrollerEvent.SCROLL_SIZE);
        expect(scrollSize).toHaveBeenCalledOnce();
        expect(sizes).not.toHaveBeenCalled();

        events._emit(VirtualScrollerEvent.SIZES);
        expect(sizes).toHaveBeenCalledOnce();

        unsubscribeRange();
        unsubscribeScrollSize();
        unsubscribeSizes();
        events._emit(VirtualScrollerEvent.RANGE);
        events._emit(VirtualScrollerEvent.SCROLL_SIZE);
        events._emit(VirtualScrollerEvent.SIZES);

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
                events._subscribe(listener, mask)
            );

            const unsubscribe = unsubscribes[masks.indexOf(removedMask)];
            if (!unsubscribe) throw new Error("Missing test subscription");
            unsubscribe();
            for (const emittedMask of masks) events._emit(emittedMask);

            expect(listener).toHaveBeenCalledTimes(2);
        }
    });

    test("coalesces callbacks across events and nested batches", () => {
        const events = new VirtualScrollerEvents();
        const listener = vi.fn();

        events._subscribe(listener, VirtualScrollerEvent.ALL);
        events._beginBatch();
        events._emit(VirtualScrollerEvent.RANGE);
        events._beginBatch();
        events._emit(VirtualScrollerEvent.SCROLL_SIZE);
        events._emit(VirtualScrollerEvent.RANGE);
        events._endBatch();

        expect(listener).not.toHaveBeenCalled();

        events._endBatch();

        expect(listener).toHaveBeenCalledOnce();
    });

    test("publishes one shared revision when the outer batch ends", () => {
        const events = new VirtualScrollerEvents();
        const rangeBefore = events._getRevision(VirtualScrollerEvent.RANGE);
        const sizesBefore = events._getRevision(VirtualScrollerEvent.SIZES);

        events._beginBatch();
        events._emit(VirtualScrollerEvent.RANGE);
        events._emit(VirtualScrollerEvent.SIZES);

        expect(events._getRevision(VirtualScrollerEvent.RANGE)).toBe(
            rangeBefore
        );
        expect(events._getRevision(VirtualScrollerEvent.SIZES)).toBe(
            sizesBefore
        );

        events._endBatch();

        const rangeAfter = events._getRevision(VirtualScrollerEvent.RANGE);
        expect(rangeAfter).toBeGreaterThan(rangeBefore);
        expect(events._getRevision(VirtualScrollerEvent.SIZES)).toBe(
            rangeAfter
        );
    });

    test("publishes batched revisions only for emitted event categories", () => {
        const masks = [
            VirtualScrollerEvent.RANGE,
            VirtualScrollerEvent.SCROLL_SIZE,
            VirtualScrollerEvent.SIZES
        ];

        for (const emitted of masks) {
            const events = new VirtualScrollerEvents();
            events._beginBatch();
            events._emit(emitted);
            events._endBatch();

            for (const selected of masks) {
                expect(events._getRevision(selected)).toBe(
                    selected === emitted ? 1 : 0
                );
            }
        }
    });

    test("treats separate subscriptions of one callback independently", () => {
        const events = new VirtualScrollerEvents();
        const listener = vi.fn();

        events._subscribe(listener, VirtualScrollerEvent.RANGE);
        events._subscribe(listener, VirtualScrollerEvent.SIZES);
        events._beginBatch();
        events._emit(VirtualScrollerEvent.RANGE);
        events._emit(VirtualScrollerEvent.SIZES);
        events._endBatch();

        expect(listener).toHaveBeenCalledTimes(2);
    });

    test("runs the outer batch hook after notifying subscribers", () => {
        const calls: string[] = [];
        const events = new VirtualScrollerEvents(() => calls.push("after"));

        events._subscribe(
            () => calls.push("listener"),
            VirtualScrollerEvent.ALL
        );
        events._beginBatch();
        events._emit(VirtualScrollerEvent.RANGE);
        events._beginBatch();
        events._emit(VirtualScrollerEvent.SIZES);
        events._endBatch();

        expect(calls).toEqual([]);

        events._endBatch();

        expect(calls).toEqual(["listener", "after"]);
    });

    test("uses the subscriptions present when a batch is flushed", () => {
        const events = new VirtualScrollerEvents();
        const first = vi.fn();
        const second = vi.fn();
        const unsubscribeFirst = events._subscribe(
            first,
            VirtualScrollerEvent.RANGE
        );

        events._beginBatch();
        events._emit(VirtualScrollerEvent.RANGE);
        unsubscribeFirst();
        events._subscribe(second, VirtualScrollerEvent.RANGE);
        events._endBatch();

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });

    test("keeps an active dispatch stable during reentrant unsubscription", () => {
        const events = new VirtualScrollerEvents();
        const calls: string[] = [];
        let unsubscribeSecond = noop;

        events._subscribe(
            () => calls.push("first"),
            VirtualScrollerEvent.RANGE
        );
        unsubscribeSecond = events._subscribe(() => {
            calls.push("second");
            unsubscribeSecond();
        }, VirtualScrollerEvent.RANGE);
        events._subscribe(
            () => calls.push("third"),
            VirtualScrollerEvent.RANGE
        );

        events._emit(VirtualScrollerEvent.RANGE);
        expect(calls).toEqual(["first", "second", "third"]);

        calls.length = 0;
        events._emit(VirtualScrollerEvent.RANGE);
        expect(calls).toEqual(["first", "third"]);
    });

    test("keeps batches isolated between dispatcher instances", () => {
        const firstEvents = new VirtualScrollerEvents();
        const secondEvents = new VirtualScrollerEvents();
        const first = vi.fn();
        const second = vi.fn();

        firstEvents._subscribe(first, VirtualScrollerEvent.RANGE);
        secondEvents._subscribe(second, VirtualScrollerEvent.RANGE);

        firstEvents._beginBatch();
        firstEvents._emit(VirtualScrollerEvent.RANGE);
        secondEvents._emit(VirtualScrollerEvent.RANGE);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();

        firstEvents._endBatch();
        expect(first).toHaveBeenCalledOnce();
    });

    test("finishes the batch and runs its hook when a subscriber throws", () => {
        const afterBatch = vi.fn();
        const events = new VirtualScrollerEvents(afterBatch);
        const unsubscribe = events._subscribe(() => {
            throw new Error("listener failed");
        }, VirtualScrollerEvent.RANGE);
        events._beginBatch();
        events._emit(VirtualScrollerEvent.RANGE);

        expect(() => events._endBatch()).toThrow("listener failed");
        expect(afterBatch).toHaveBeenCalledOnce();

        unsubscribe();
        const listener = vi.fn();
        events._subscribe(listener, VirtualScrollerEvent.RANGE);
        events._emit(VirtualScrollerEvent.RANGE);
        expect(listener).toHaveBeenCalledOnce();
    });

    test("rejects an unmatched endBatch call", () => {
        const events = new VirtualScrollerEvents();

        expect(() => events._endBatch()).toThrowError(
            expect.objectContaining({ code: "AFV_BATCH_INVARIANT" })
        );
    });

    test("dispose clears retained subscriptions and pending events", () => {
        const events = new VirtualScrollerEvents();
        const listener = vi.fn();
        events._subscribe(listener);
        events._beginBatch();
        events._emit(VirtualScrollerEvent.RANGE);

        events._dispose();
        events._endBatch();
        events._emit(VirtualScrollerEvent.RANGE);

        expect(listener).not.toHaveBeenCalled();
    });
});
