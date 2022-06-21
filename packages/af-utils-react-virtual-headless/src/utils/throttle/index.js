import { MEASUREMENTS_MAX_DELAY } from "constants";

const throttle = fn => {
    let timer = 0;

    const cancel = () => {
        clearTimeout(timer);
        timer = 0;
    };

    const invoke = () => {
        timer = 0;
        fn();
    };

    const throttled = () => {
        if (timer === 0) {
            timer = setTimeout(invoke, MEASUREMENTS_MAX_DELAY);
        }
    };

    throttled._cancel = cancel;

    return throttled;
};

export default throttle;
