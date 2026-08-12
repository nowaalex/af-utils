import { bench, describe } from "vitest";
import ScrollActivity, { type ScrollActivityScheduler } from ".";

const TRANSITIONS_PER_SAMPLE = 10_000;
const FLAG_TRANSITIONS_PER_SAMPLE = 100_000;
let currentTime = 0;
let benchmarkSink = 0;

const scheduler: ScrollActivityScheduler = {
    _now: () => ++currentTime,
    _setTimeout: () => 1 as unknown as ReturnType<typeof setTimeout>,
    _clearTimeout: () => {}
};
const activity = new ScrollActivity(() => benchmarkSink++, scheduler);

/** Boolean-field baseline matching the production flag transition surface. */
class BooleanScrollFlags {
    private _nativeScrollEndSupported = false;
    private _programmaticPending = false;
    private _indexConverging = false;

    /** Set whether native `scrollend` is supported. */
    _setNativeScrollEndSupported(supported: boolean) {
        this._nativeScrollEndSupported = supported;
    }

    /** Set whether a programmatic scroll is pending. */
    _setProgrammaticPending(pending: boolean) {
        this._programmaticPending = pending;
    }

    /** Set whether index convergence is active. */
    _setIndexConverging(converging: boolean) {
        this._indexConverging = converging;
    }

    /** Whether native `scrollend` is supported. */
    get _supportsNativeScrollEnd() {
        return this._nativeScrollEndSupported;
    }

    /** Whether any programmatic scroll state is active. */
    get _programmaticScrollActive() {
        return this._programmaticPending || this._indexConverging;
    }
}

const NATIVE_SCROLL_END_FLAG = 1;
const PROGRAMMATIC_PENDING_FLAG = 2;
const INDEX_CONVERGING_FLAG = 4;
const PROGRAMMATIC_SCROLL_FLAGS =
    PROGRAMMATIC_PENDING_FLAG | INDEX_CONVERGING_FLAG;

/** SMI-bitmask baseline matching the production flag transition surface. */
class BitmaskScrollFlags {
    private _flags = 0;

    /** Set whether native `scrollend` is supported. */
    _setNativeScrollEndSupported(supported: boolean) {
        if (supported) this._flags |= NATIVE_SCROLL_END_FLAG;
        else this._flags &= ~NATIVE_SCROLL_END_FLAG;
    }

    /** Set whether a programmatic scroll is pending. */
    _setProgrammaticPending(pending: boolean) {
        if (pending) this._flags |= PROGRAMMATIC_PENDING_FLAG;
        else this._flags &= ~PROGRAMMATIC_PENDING_FLAG;
    }

    /** Set whether index convergence is active. */
    _setIndexConverging(converging: boolean) {
        if (converging) this._flags |= INDEX_CONVERGING_FLAG;
        else this._flags &= ~INDEX_CONVERGING_FLAG;
    }

    /** Whether native `scrollend` is supported. */
    get _supportsNativeScrollEnd() {
        return (this._flags & NATIVE_SCROLL_END_FLAG) !== 0;
    }

    /** Whether any programmatic scroll state is active. */
    get _programmaticScrollActive() {
        return (this._flags & PROGRAMMATIC_SCROLL_FLAGS) !== 0;
    }
}

const booleanFlags = new BooleanScrollFlags();
const bitmaskFlags = new BitmaskScrollFlags();

describe("scroll activity transitions", () => {
    bench("10k native-scroll transitions", () => {
        activity._setNativeScrollEndSupported(true);

        for (
            let transition = 0;
            transition < TRANSITIONS_PER_SAMPLE;
            transition++
        ) {
            activity._onNativeScroll();
            activity._onNativeScrollEnd();
        }
    });

    bench("10k fallback-scroll transitions", () => {
        activity._setNativeScrollEndSupported(false);

        for (
            let transition = 0;
            transition < TRANSITIONS_PER_SAMPLE;
            transition++
        ) {
            activity._onNativeScroll();
        }
    });
});

describe("scroll activity flag representation", () => {
    bench("100k boolean-field transitions", () => {
        let result = 0;
        for (
            let transition = 0;
            transition < FLAG_TRANSITIONS_PER_SAMPLE;
            transition++
        ) {
            booleanFlags._setNativeScrollEndSupported((transition & 1) !== 0);
            booleanFlags._setProgrammaticPending((transition & 2) !== 0);
            booleanFlags._setIndexConverging((transition & 4) !== 0);
            result +=
                Number(booleanFlags._supportsNativeScrollEnd) +
                Number(booleanFlags._programmaticScrollActive);
        }
        benchmarkSink = result;
    });

    bench("100k bitmask transitions", () => {
        let result = 0;
        for (
            let transition = 0;
            transition < FLAG_TRANSITIONS_PER_SAMPLE;
            transition++
        ) {
            bitmaskFlags._setNativeScrollEndSupported((transition & 1) !== 0);
            bitmaskFlags._setProgrammaticPending((transition & 2) !== 0);
            bitmaskFlags._setIndexConverging((transition & 4) !== 0);
            result +=
                Number(bitmaskFlags._supportsNativeScrollEnd) +
                Number(bitmaskFlags._programmaticScrollActive);
        }
        benchmarkSink = result;
    });
});

void benchmarkSink;
