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

    now() {
        return this.currentTime;
    }

    setTimeout(callback: () => void, delayMs: number) {
        const timer = this.nextTimer++;
        this.timers.set(timer, {
            callback,
            deadline: this.currentTime + delayMs
        });
        return timer as unknown as Timer;
    }

    clearTimeout(timer: Timer) {
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
            const task = this.timers.get(nextTimer)!;
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

        activity.onNativeScroll();
        expect(activity.nativeScrollActive).toBe(true);

        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS - 1);
        expect(activity.nativeScrollActive).toBe(true);
        expect(onIdle).not.toHaveBeenCalled();

        scheduler.advanceBy(1);
        expect(activity.nativeScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
    });

    test("waits for native scrollend when the platform supports it", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity.setNativeScrollEndSupported(true);
        activity.onNativeScroll();
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS);

        expect(activity.nativeScrollActive).toBe(true);
        expect(onIdle).not.toHaveBeenCalled();

        activity.onNativeScrollEnd();
        expect(activity.nativeScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
    });

    test("changes native scrollend support without clearing active flags", () => {
        const scheduler = new TestScheduler();
        const activity = new ScrollActivity(() => {}, scheduler);

        activity.startProgrammaticScroll(1_000);
        activity.setPointerDragging(true);
        activity.setNativeScrollEndSupported(true);
        activity.setNativeScrollEndSupported(false);

        expect(activity.pointerDragging).toBe(true);
        expect(activity.programmaticScrollActive).toBe(true);
    });

    test("tracks pointer ownership without scheduling idle work", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity.setPointerDragging(true);
        scheduler.advanceBy(500);
        activity.setPointerDragging(false);

        expect(activity.pointerDragging).toBe(false);
        expect(scheduler.pendingTimers).toBe(0);
        expect(activity.nativeScrollActive).toBe(false);
        expect(onIdle).not.toHaveBeenCalled();
    });

    test("treats native scrollend as the definitive idle boundary", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity.setNativeScrollEndSupported(true);
        activity.onNativeScroll();
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS / 2);
        activity.onNativeScrollEnd();

        expect(activity.nativeScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
        expect(scheduler.pendingTimers).toBe(0);
    });

    test("keeps programmatic state while index convergence is active", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity.setIndexConverging(true);
        activity.startProgrammaticScroll(SCROLL_ENDED_IDLE_TIMEOUT_MS);
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS);

        expect(activity.programmaticScrollActive).toBe(true);
        expect(onIdle).toHaveBeenCalledOnce();

        activity.setIndexConverging(false);
        expect(activity.programmaticScrollActive).toBe(false);
    });

    test("restarts the programmatic release timeout", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity.startProgrammaticScroll(100);
        scheduler.advanceBy(75);
        activity.startProgrammaticScroll(100);
        scheduler.advanceBy(99);

        expect(activity.programmaticScrollActive).toBe(true);
        expect(onIdle).not.toHaveBeenCalled();

        scheduler.advanceBy(1);
        expect(activity.programmaticScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();
    });

    test("reports exact idle-duration boundaries", () => {
        const scheduler = new TestScheduler();
        const activity = new ScrollActivity(() => {}, scheduler);

        expect(activity.hasBeenIdleFor(10_000)).toBe(true);
        activity.setNativeScrollEndSupported(true);
        activity.onNativeScroll();
        expect(activity.hasBeenIdleFor(0)).toBe(false);

        scheduler.advanceBy(1);
        expect(activity.hasBeenIdleFor(0)).toBe(true);
        expect(activity.hasBeenIdleFor(1)).toBe(false);
    });

    test("allows anchor correction only while every scroll state is idle", () => {
        const scheduler = new TestScheduler();
        const activity = new ScrollActivity(() => {}, scheduler);

        expect(activity.anchorCorrectionAllowed).toBe(true);

        activity.setPointerDragging(true);
        expect(activity.anchorCorrectionAllowed).toBe(false);
        activity.setPointerDragging(false);

        activity.setNativeScrollEndSupported(true);
        activity.onNativeScroll();
        expect(activity.anchorCorrectionAllowed).toBe(false);
        activity.onNativeScrollEnd();

        activity.startProgrammaticScroll(1_000);
        expect(activity.anchorCorrectionAllowed).toBe(false);
        scheduler.advanceBy(1_000);

        activity.setIndexConverging(true);
        expect(activity.anchorCorrectionAllowed).toBe(false);
        activity.setIndexConverging(false);

        expect(activity.anchorCorrectionAllowed).toBe(true);
    });

    test("native scrollend supersedes an imminent programmatic timeout", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity.setNativeScrollEndSupported(true);
        activity.startProgrammaticScroll(10);
        activity.onNativeScroll();
        activity.onNativeScrollEnd();
        scheduler.advanceBy(10);

        expect(onIdle).toHaveBeenCalledOnce();
        expect(activity.programmaticScrollActive).toBe(false);
        expect(scheduler.pendingTimers).toBe(0);
    });

    test("reset cancels timers and reports idle state", () => {
        const scheduler = new TestScheduler();
        const onIdle = vi.fn();
        const activity = new ScrollActivity(onIdle, scheduler);

        activity.onNativeScroll();
        activity.startProgrammaticScroll(1_000);
        activity.setPointerDragging(true);
        activity.setIndexConverging(true);
        activity.reset();

        expect(scheduler.pendingTimers).toBe(0);
        expect(activity.pointerDragging).toBe(false);
        expect(activity.nativeScrollActive).toBe(false);
        expect(activity.programmaticScrollActive).toBe(false);
        expect(onIdle).toHaveBeenCalledOnce();

        onIdle.mockClear();
        activity.onNativeScroll();
        scheduler.advanceBy(SCROLL_ENDED_IDLE_TIMEOUT_MS);
        expect(onIdle).toHaveBeenCalledOnce();
    });
});
