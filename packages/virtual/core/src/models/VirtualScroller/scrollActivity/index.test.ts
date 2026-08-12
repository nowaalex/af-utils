import { describe, expect, test, vi } from "vitest";
import ScrollActivity, {
    SCROLL_ENDED_IDLE_TIMEOUT_MS,
    type ScrollActivityScheduler
} from ".";

type Timer = ReturnType<typeof setTimeout>;

class TestScheduler implements ScrollActivityScheduler {
    private currentTime = 0;
    private nextTimer = 1;
    private timers = new Map<
        number,
        { callback: () => void; deadline: number }
    >();

    _now() {
        return this.currentTime;
    }

    _setTimeout(callback: () => void, delayMs: number) {
        const timer = this.nextTimer++;
        this.timers.set(timer, {
            callback,
            deadline: this.currentTime + delayMs
        });
        return timer as unknown as Timer;
    }

    _clearTimeout(timer: Timer) {
        this.timers.delete(timer as unknown as number);
    }

    advanceBy(durationMs: number) {
        const targetTime = this.currentTime + durationMs;

        while (true) {
            let nextTimer = 0;
            let nextDeadline = Number.POSITIVE_INFINITY;

            for (const [timer, task] of this.timers) {
                if (task.deadline < nextDeadline) {
                    nextTimer = timer;
                    nextDeadline = task.deadline;
                }
            }

            if (nextDeadline > targetTime) break;

            this.currentTime = nextDeadline;
            const task = this.timers.get(nextTimer);
            if (!task) throw new Error("Missing scheduled test task");
            this.timers.delete(nextTimer);
            task.callback();
        }

        this.currentTime = targetTime;
    }

    get pendingTimers() {
        return this.timers.size;
    }
}

describe("ScrollActivity", () => {
    test("finishes fallback scrolling after one quiet period", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity._onNativeScroll();
        expect(activity._nativeScrollActive).toBe(true);

        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS - 1);
        expect(activity._nativeScrollActive).toBe(true);
        expect(onIdle).not.toHaveBeenCalled();

        scheduler.advanceBy(1);
        expect(activity._nativeScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
    });

    test("waits for native scrollend when the platform supports it", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity._setNativeScrollEndSupported(true);
        activity._onNativeScroll();
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS);

        expect(activity._nativeScrollActive).toBe(true);
        expect(onIdle).not.toHaveBeenCalled();

        activity._onNativeScrollEnd();
        expect(activity._nativeScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
    });

    test("changes native scrollend support without clearing active flags", () => {
        const scheduler = new TestScheduler();
        const activity = new ScrollActivity(() => {}, scheduler);

        activity._startProgrammaticScroll(1_000);
        activity._setNativeScrollEndSupported(true);
        activity._setNativeScrollEndSupported(false);

        expect(activity._programmaticScrollActive).toBe(true);
    });

    test("treats native scrollend as the definitive idle boundary", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity._setNativeScrollEndSupported(true);
        activity._onNativeScroll();
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS / 2);
        activity._onNativeScrollEnd();

        expect(activity._nativeScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
        expect(scheduler.pendingTimers).toBe(0);
    });

    test("keeps programmatic state while index convergence is active", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity._setIndexConverging(true);
        activity._startProgrammaticScroll(SCROLL_ENDED_IDLE_TIMEOUT_MS);
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS);

        expect(activity._programmaticScrollActive).toBe(true);
        expect(onIdle).toHaveBeenCalledOnce();

        activity._setIndexConverging(false);
        expect(activity._programmaticScrollActive).toBe(false);
    });

    test("restarts the programmatic release timeout", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity._startProgrammaticScroll(100);
        scheduler.advanceBy(75);
        activity._startProgrammaticScroll(100);
        scheduler.advanceBy(99);

        expect(activity._programmaticScrollActive).toBe(true);
        expect(onIdle).not.toHaveBeenCalled();

        scheduler.advanceBy(1);
        expect(activity._programmaticScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
    });

    test("reports exact idle-duration boundaries", () => {
        const scheduler = new TestScheduler();
        const activity = new ScrollActivity(() => {}, scheduler);

        expect(activity._hasBeenIdleFor(10_000)).toBe(true);
        activity._setNativeScrollEndSupported(true);
        activity._onNativeScroll();
        expect(activity._hasBeenIdleFor(0)).toBe(false);

        scheduler.advanceBy(1);
        expect(activity._hasBeenIdleFor(0)).toBe(true);
        expect(activity._hasBeenIdleFor(1)).toBe(false);
    });

    test("allows anchor correction only while every scroll state is idle", () => {
        const scheduler = new TestScheduler();
        const activity = new ScrollActivity(() => {}, scheduler);

        expect(activity._anchorCorrectionAllowed).toBe(true);

        activity._setNativeScrollEndSupported(true);
        activity._onNativeScroll();
        expect(activity._anchorCorrectionAllowed).toBe(false);
        activity._onNativeScrollEnd();

        activity._startProgrammaticScroll(1_000);
        expect(activity._anchorCorrectionAllowed).toBe(false);
        scheduler.advanceBy(1_000);

        activity._setIndexConverging(true);
        expect(activity._anchorCorrectionAllowed).toBe(false);
        activity._setIndexConverging(false);

        expect(activity._anchorCorrectionAllowed).toBe(true);
    });

    test("native scrollend supersedes an imminent programmatic timeout", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity._setNativeScrollEndSupported(true);
        activity._startProgrammaticScroll(10);
        activity._onNativeScroll();
        activity._onNativeScrollEnd();
        scheduler.advanceBy(10);

        expect(onIdle).toHaveBeenCalledOnce();
        expect(activity._programmaticScrollActive).toBe(false);
        expect(scheduler.pendingTimers).toBe(0);
    });

    test("reset cancels timers and reports idle state", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity._onNativeScroll();
        activity._startProgrammaticScroll(1_000);
        activity._setIndexConverging(true);
        activity._reset();

        expect(scheduler.pendingTimers).toBe(0);
        expect(activity._nativeScrollActive).toBe(false);
        expect(activity._programmaticScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();

        onIdle.mockClear();
        activity._onNativeScroll();
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS);
        expect(onIdle).toHaveBeenCalledOnce();
    });
});
