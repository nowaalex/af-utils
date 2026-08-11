/** Quiet period used to emulate `scrollend` when the platform lacks it. */
export const SCROLL_ENDED_IDLE_TIMEOUT_MS = 128;

type Timer = ReturnType<typeof setTimeout>;

const NATIVE_SCROLL_END_FLAG = 1;
const POINTER_DRAGGING_FLAG = 2;
const PROGRAMMATIC_PENDING_FLAG = 4;
const INDEX_CONVERGING_FLAG = 8;
const PROGRAMMATIC_SCROLL_FLAGS =
    PROGRAMMATIC_PENDING_FLAG | INDEX_CONVERGING_FLAG;
const ANCHOR_CORRECTION_BLOCKING_FLAGS =
    POINTER_DRAGGING_FLAG | PROGRAMMATIC_SCROLL_FLAGS;

export interface ScrollActivityScheduler {
    now(): number;
    setTimeout(callback: () => void, delayMs: number): Timer;
    clearTimeout(timer: Timer): void;
}

const browserScheduler: ScrollActivityScheduler = {
    now: () => performance.now(),
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimeout: timer => clearTimeout(timer)
};

/** Owns native, pointer, and programmatic scroll lifecycle state. */
class ScrollActivity {
    private _onIdle: () => void;
    private _scheduler: ScrollActivityScheduler;
    /** Boolean lifecycle state kept in one V8 SMI for cheap combined reads. */
    private _flags = 0;
    private _lastScrollTimestampMs = Number.NEGATIVE_INFINITY;
    private _scrollIdleTimer: Timer | 0 = 0;
    private _programmaticReleaseTimer: Timer | 0 = 0;

    private _finish = () => {
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._scrollIdleTimer) {
            this._scheduler.clearTimeout(this._scrollIdleTimer);
            this._scrollIdleTimer = 0;
        }
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._programmaticReleaseTimer) {
            this._scheduler.clearTimeout(this._programmaticReleaseTimer);
            this._programmaticReleaseTimer = 0;
        }

        this._lastScrollTimestampMs = Number.NEGATIVE_INFINITY;
        this._flags &= ~PROGRAMMATIC_PENDING_FLAG;
        this._onIdle();
    };

    constructor(
        onIdle: () => void,
        scheduler: ScrollActivityScheduler = browserScheduler
    ) {
        this._onIdle = onIdle;
        this._scheduler = scheduler;
    }

    get pointerDragging() {
        return (this._flags & POINTER_DRAGGING_FLAG) !== 0;
    }

    get nativeScrollActive() {
        return this._lastScrollTimestampMs !== Number.NEGATIVE_INFINITY;
    }

    get programmaticScrollActive() {
        return (this._flags & PROGRAMMATIC_SCROLL_FLAGS) !== 0;
    }

    /** Whether item measurements may safely correct the current anchor. */
    get anchorCorrectionAllowed() {
        return (
            this._lastScrollTimestampMs === Number.NEGATIVE_INFINITY &&
            (this._flags & ANCHOR_CORRECTION_BLOCKING_FLAGS) === 0
        );
    }

    setNativeScrollEndSupported(supported: boolean) {
        if (supported) this._flags |= NATIVE_SCROLL_END_FLAG;
        else this._flags &= ~NATIVE_SCROLL_END_FLAG;
    }

    onNativeScroll() {
        this._lastScrollTimestampMs = this._scheduler.now();
        if ((this._flags & NATIVE_SCROLL_END_FLAG) === 0) {
            this._scheduleFinish();
        }
    }

    onNativeScrollEnd() {
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._programmaticReleaseTimer) {
            this._scheduler.clearTimeout(this._programmaticReleaseTimer);
            this._programmaticReleaseTimer = 0;
        }

        this._finish();
    }

    setPointerDragging(active: boolean) {
        if (active) this._flags |= POINTER_DRAGGING_FLAG;
        else this._flags &= ~POINTER_DRAGGING_FLAG;
    }

    startProgrammaticScroll(releaseAfterMs: number) {
        this._flags |= PROGRAMMATIC_PENDING_FLAG;
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._programmaticReleaseTimer) {
            this._scheduler.clearTimeout(this._programmaticReleaseTimer);
        }
        this._programmaticReleaseTimer = this._scheduler.setTimeout(
            this._finish,
            releaseAfterMs
        );
    }

    setIndexConverging(active: boolean) {
        if (active) this._flags |= INDEX_CONVERGING_FLAG;
        else this._flags &= ~INDEX_CONVERGING_FLAG;
    }

    hasBeenIdleFor(durationMs: number) {
        return this._scheduler.now() - this._lastScrollTimestampMs > durationMs;
    }

    reset() {
        this._flags = 0;
        this._finish();
    }

    private _scheduleFinish() {
        const idleTime = Math.max(
            0.0,
            this._scheduler.now() - this._lastScrollTimestampMs
        );
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._scrollIdleTimer) {
            this._scheduler.clearTimeout(this._scrollIdleTimer);
        }
        this._scrollIdleTimer = this._scheduler.setTimeout(
            this._finish,
            Math.max(0.0, SCROLL_ENDED_IDLE_TIMEOUT_MS - idleTime)
        );
    }
}

export default ScrollActivity;
