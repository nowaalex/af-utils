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

class BooleanScrollFlags {
    private _pointerDragging = false;
    private _programmaticPending = false;
    private _indexConverging = false;

    setPointerDragging(pointer: boolean) {
        this._pointerDragging = pointer;
    }

    setProgrammaticPending(programmatic: boolean) {
        this._programmaticPending = programmatic;
    }

    setIndexConverging(converging: boolean) {
        this._indexConverging = converging;
    }

    get pointerDragging() {
        return this._pointerDragging;
    }

    get programmaticScrollActive() {
        return this._programmaticPending || this._indexConverging;
    }
}

const POINTER_DRAGGING_FLAG = 1;
const PROGRAMMATIC_PENDING_FLAG = 2;
const INDEX_CONVERGING_FLAG = 4;

class BitmaskScrollFlags {
    private _flags = 0;

    setPointerDragging(pointer: boolean) {
        if (pointer) this._flags |= POINTER_DRAGGING_FLAG;
        else this._flags &= ~POINTER_DRAGGING_FLAG;
    }

    setProgrammaticPending(programmatic: boolean) {
        if (programmatic) this._flags |= PROGRAMMATIC_PENDING_FLAG;
        else this._flags &= ~PROGRAMMATIC_PENDING_FLAG;
    }

    setIndexConverging(converging: boolean) {
        if (converging) this._flags |= INDEX_CONVERGING_FLAG;
        else this._flags &= ~INDEX_CONVERGING_FLAG;
    }

    get pointerDragging() {
        return (this._flags & POINTER_DRAGGING_FLAG) !== 0;
    }

    get programmaticScrollActive() {
        return (
            (this._flags &
                (PROGRAMMATIC_PENDING_FLAG | INDEX_CONVERGING_FLAG)) !==
            0
        );
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
            booleanFlags._setPointerDragging((transition & 1) !== 0);
            booleanFlags.setProgrammaticPending((transition & 2) !== 0);
            booleanFlags._setIndexConverging((transition & 4) !== 0);
            result +=
                Number(booleanFlags._pointerDragging) +
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
            bitmaskFlags._setPointerDragging((transition & 1) !== 0);
            bitmaskFlags.setProgrammaticPending((transition & 2) !== 0);
            bitmaskFlags._setIndexConverging((transition & 4) !== 0);
            result +=
                Number(bitmaskFlags._pointerDragging) +
                Number(bitmaskFlags._programmaticScrollActive);
        }
        benchmarkSink = result;
    });
});

void benchmarkSink;
