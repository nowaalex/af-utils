import { MEASUREMENTS_MAX_DELAY } from "constants";

const IdleOptions = { timeout: MEASUREMENTS_MAX_DELAY };

const delay =
    globalThis.requestIdleCallback ||
    (fn => setTimeout(fn, MEASUREMENTS_MAX_DELAY));
const cancelDelay = globalThis.cancelIdleCallback || clearTimeout;

const throttle = fn => {
    let timer = 0;

    const cancel = () => {
        cancelDelay(timer);
        timer = 0;
    };

    const invoke = () => {
        timer = 0;
        fn();
    };

    const throttled = () => {
        if (timer === 0) {
            timer = delay(invoke, IdleOptions);
        }
    };

    throttled._cancel = cancel;

    return throttled;
};

export default throttle;
