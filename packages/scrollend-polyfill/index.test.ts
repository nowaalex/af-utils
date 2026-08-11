import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    vi
} from "vitest";

class TestElement extends EventTarget {}

const testWindow = new EventTarget();
const testDocument = new EventTarget();
const originalGlobals = {
    HTMLElement: globalThis.HTMLElement,
    addEventListener: globalThis.addEventListener,
    document: globalThis.document,
    window: globalThis.window
};

beforeAll(async () => {
    Object.assign(globalThis, {
        HTMLElement: TestElement,
        addEventListener: testWindow.addEventListener.bind(testWindow),
        document: testDocument,
        window: testWindow
    });
    await import("./index");
});

beforeEach(() => vi.useFakeTimers());

afterAll(() => {
    vi.useRealTimers();
    Object.assign(globalThis, originalGlobals);
});

const finishScroll = (target: EventTarget) => {
    target.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(100);
};

const dispatchTouches = (
    type: "touchstart" | "touchend" | "touchcancel",
    ...identifiers: number[]
) => {
    const event = new Event(type) as TouchEvent;
    Object.defineProperty(event, "changedTouches", {
        value: identifiers.map(identifier => ({ identifier }))
    });
    testWindow.dispatchEvent(event);
};

describe("scrollend listener lifecycle", () => {
    test("keeps the same listener independent across targets", () => {
        const first = new TestElement();
        const second = new TestElement();
        const listener = vi.fn();

        first.addEventListener("scrollend", listener);
        second.addEventListener("scrollend", listener);
        first.removeEventListener("scrollend", listener);

        finishScroll(first);
        expect(listener).not.toHaveBeenCalled();

        finishScroll(second);
        expect(listener).toHaveBeenCalledOnce();
    });

    test("dispatches only once when a target has multiple listeners", () => {
        const target = new TestElement();
        const first = vi.fn();
        const second = vi.fn();

        target.addEventListener("scrollend", first);
        target.addEventListener("scrollend", second);
        finishScroll(target);

        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
    });

    test("does not leak a duplicate registration", () => {
        const target = new TestElement();
        const listener = vi.fn();

        target.addEventListener("scrollend", listener);
        target.addEventListener("scrollend", listener, { once: true });
        target.removeEventListener("scrollend", listener);
        finishScroll(target);

        expect(listener).not.toHaveBeenCalled();
    });

    test("honours once and AbortSignal listener lifetimes", () => {
        const onceTarget = new TestElement();
        const onceListener = vi.fn();
        onceTarget.addEventListener("scrollend", onceListener, { once: true });

        finishScroll(onceTarget);
        finishScroll(onceTarget);
        expect(onceListener).toHaveBeenCalledOnce();

        const abortedTarget = new TestElement();
        const abortedListener = vi.fn();
        const controller = new AbortController();
        abortedTarget.addEventListener("scrollend", abortedListener, {
            signal: controller.signal
        });
        controller.abort();
        finishScroll(abortedTarget);

        expect(abortedListener).not.toHaveBeenCalled();
    });
});

describe("scrollend touch lifecycle", () => {
    test("dispatches exactly once after the final touch ends", () => {
        const target = new TestElement();
        const listener = vi.fn();
        target.addEventListener("scrollend", listener);

        dispatchTouches("touchstart", 1);
        finishScroll(target);
        expect(listener).not.toHaveBeenCalled();

        dispatchTouches("touchend", 1);
        vi.advanceTimersByTime(1_000);
        expect(listener).toHaveBeenCalledOnce();
    });

    test("releases a pending scroll after touchcancel", () => {
        const target = new TestElement();
        const listener = vi.fn();
        target.addEventListener("scrollend", listener);

        dispatchTouches("touchstart", 2);
        finishScroll(target);
        dispatchTouches("touchcancel", 2);

        expect(listener).toHaveBeenCalledOnce();
    });

    test("waits for debounce again after another touch scroll", () => {
        const target = new TestElement();
        const listener = vi.fn();
        target.addEventListener("scrollend", listener);

        dispatchTouches("touchstart", 5);
        finishScroll(target);
        target.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(50);
        dispatchTouches("touchend", 5);
        expect(listener).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(listener).toHaveBeenCalledOnce();
    });

    test("waits for every active touch and flushes every pending target", () => {
        const first = new TestElement();
        const second = new TestElement();
        const firstListener = vi.fn();
        const secondListener = vi.fn();
        first.addEventListener("scrollend", firstListener);
        second.addEventListener("scrollend", secondListener);

        dispatchTouches("touchstart", 3, 4);
        finishScroll(first);
        finishScroll(second);
        dispatchTouches("touchend", 3);
        expect(firstListener).not.toHaveBeenCalled();
        expect(secondListener).not.toHaveBeenCalled();

        dispatchTouches("touchcancel", 4);
        expect(firstListener).toHaveBeenCalledOnce();
        expect(secondListener).toHaveBeenCalledOnce();
    });
});
