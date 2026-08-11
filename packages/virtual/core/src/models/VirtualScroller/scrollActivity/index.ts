/** Quiet period used to emulate `scrollend` when the platform lacks it. */
export const SCROLL_ENDED_IDLE_TIMEOUT_MS = 128;

type Timer = ReturnType<typeof setTimeout>;

const NATIVE_SCROLL_END_FLAG = 1;
const PROGRAMMATIC_PENDING_FLAG = 2;
const INDEX_CONVERGING_FLAG = 4;
const PROGRAMMATIC_SCROLL_FLAGS =
    PROGRAMMATIC_PENDING_FLAG | INDEX_CONVERGING_FLAG;

export interface ScrollActivityScheduler {
    /** Return the scheduler's current monotonic timestamp. */
    _now(): number;
    /** Schedule a callback after the requested delay. */
    _setTimeout(callback: () => void, delayMs: number): Timer;
    /** Cancel a previously scheduled callback. */
    _clearTimeout(timer: Timer): void;
}

const browserScheduler: ScrollActivityScheduler = {
    _now: () => performance.now(),
    _setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    _clearTimeout: timer => clearTimeout(timer)
};

/** Owns native and programmatic scroll lifecycle state. */
class ScrollActivity {
    private _onIdle: () => void;
    private _scheduler: ScrollActivityScheduler;
    /** Boolean lifecycle state kept in one V8 SMI for cheap combined reads. */
    private _flags = 0;
    private _lastScrollTimestampMs = Number.NEGATIVE_INFINITY;
    private _scrollIdleTimer: Timer | 0 = 0;
    private _programmaticReleaseTimer: Timer | 0 = 0;

    /** Clear activity timers and publish the idle transition. */
    private _finish = () => {
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._scrollIdleTimer) {
            this._scheduler._clearTimeout(this._scrollIdleTimer);
            this._scrollIdleTimer = 0;
        }
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._programmaticReleaseTimer) {
            this._scheduler._clearTimeout(this._programmaticReleaseTimer);
            this._programmaticReleaseTimer = 0;
        }

        this._lastScrollTimestampMs = Number.NEGATIVE_INFINITY;
        this._flags &= ~PROGRAMMATIC_PENDING_FLAG;
        this._onIdle();
    };

    /** Create scroll-activity state with an idle callback and scheduler. */
    constructor(
        onIdle: () => void,
        scheduler: ScrollActivityScheduler = browserScheduler
    ) {
        this._onIdle = onIdle;
        this._scheduler = scheduler;
    }

    /** Whether native scrolling has started without reaching an idle boundary. */
    get _nativeScrollActive() {
        return this._lastScrollTimestampMs !== Number.NEGATIVE_INFINITY;
    }

    /** Whether a programmatic scroll or index convergence is active. */
    get _programmaticScrollActive() {
        return (this._flags & PROGRAMMATIC_SCROLL_FLAGS) !== 0;
    }

    /** Whether item measurements may safely correct the current anchor. */
    get _anchorCorrectionAllowed() {
        return (
            this._lastScrollTimestampMs === Number.NEGATIVE_INFINITY &&
            (this._flags & PROGRAMMATIC_SCROLL_FLAGS) === 0
        );
    }

    /** Record whether the attached platform provides native `scrollend`. */
    _setNativeScrollEndSupported(supported: boolean) {
        if (supported) this._flags |= NATIVE_SCROLL_END_FLAG;
        else this._flags &= ~NATIVE_SCROLL_END_FLAG;
    }

    /** Record one native scroll event and schedule fallback idle detection. */
    _onNativeScroll() {
        this._lastScrollTimestampMs = this._scheduler._now();
        if ((this._flags & NATIVE_SCROLL_END_FLAG) === 0) {
            this._scheduleFinish();
        }
    }

    /** Finish activity at a definitive native `scrollend` boundary. */
    _onNativeScrollEnd() {
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._programmaticReleaseTimer) {
            this._scheduler._clearTimeout(this._programmaticReleaseTimer);
            this._programmaticReleaseTimer = 0;
        }

        this._finish();
    }

    /** Start programmatic activity with a failsafe release timeout. */
    _startProgrammaticScroll(releaseAfterMs: number) {
        this._flags |= PROGRAMMATIC_PENDING_FLAG;
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._programmaticReleaseTimer) {
            this._scheduler._clearTimeout(this._programmaticReleaseTimer);
        }
        this._programmaticReleaseTimer = this._scheduler._setTimeout(
            this._finish,
            releaseAfterMs
        );
    }

    /** Set whether repeated `scrollToIndex` corrections are active. */
    _setIndexConverging(active: boolean) {
        if (active) this._flags |= INDEX_CONVERGING_FLAG;
        else this._flags &= ~INDEX_CONVERGING_FLAG;
    }

    /** Return whether the last native scroll is older than a duration. */
    _hasBeenIdleFor(durationMs: number) {
        return (
            this._scheduler._now() - this._lastScrollTimestampMs > durationMs
        );
    }

    /** Clear all activity and synchronously publish the idle state. */
    _reset() {
        this._flags = 0;
        this._finish();
    }

    /** Schedule fallback idle detection relative to the latest scroll event. */
    private _scheduleFinish() {
        const idleTime = Math.max(
            0.0,
            this._scheduler._now() - this._lastScrollTimestampMs
        );
        // Stryker disable next-line ConditionalExpression: clearTimeout(0) is observably equivalent; the guard avoids a needless host call.
        if (this._scrollIdleTimer) {
            this._scheduler._clearTimeout(this._scrollIdleTimer);
        }
        this._scrollIdleTimer = this._scheduler._setTimeout(
            this._finish,
            Math.max(0.0, SCROLL_ENDED_IDLE_TIMEOUT_MS - idleTime)
        );
    }
}

export default ScrollActivity;
