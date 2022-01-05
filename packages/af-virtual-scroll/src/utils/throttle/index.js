const IdleOptions = { timeout: 1000 };

const throttle = ( fn, ms, ctx ) => {

    let mainTimer = 0,
        idleTimer = 0;

    const boundFn = fn.bind( ctx );

    const requestIdleCallbackPolyfilled = window.requestIdleCallback || (fn => (fn(), 1));
    const cancelIdleCallbackPolyfilled = window.cancelIdleCallback || (() => {});

    const cancel = () => {
        clearTimeout( mainTimer );
        cancelIdleCallbackPolyfilled( idleTimer );
        mainTimer = idleTimer = 0;
    }

    const invoke = () => {
        mainTimer = 0;
        idleTimer = requestIdleCallbackPolyfilled( boundFn, IdleOptions );
    }

    const throttled = () => {
        if( mainTimer === 0 && idleTimer === 0 ){
            mainTimer = setTimeout( invoke, ms );
        }
    }

    throttled._cancel = cancel;

    return throttled;
}

export default throttle;