const IdleOptions = { timeout: 2000 };

const delay = globalThis.requestIdleCallback || (fn => setTimeout(fn, 500));
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
