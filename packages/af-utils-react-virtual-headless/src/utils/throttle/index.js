const IdleOptions = { timeout: 2000 };

const delay = globalThis.requestIdleCallback || ( fn => setTimeout( fn, 500 ) );
const cancelDelay = globalThis.cancelIdleCallback || clearTimeout;

const throttle = ( fn, ctx ) => {

    let timer = 0;

    const boundFn = fn.bind( ctx );

    const cancel = () => {
        cancelDelay( timer );
        timer = 0;
    }

    const invoke = () => {
        timer = 0;
        boundFn();
    }

    const throttled = () => {
        if( timer === 0 ){
            timer = delay( invoke, IdleOptions );
        }
    }

    throttled._cancel = cancel;

    return throttled;
}

export default throttle;