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
