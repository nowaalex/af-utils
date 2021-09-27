const throttle = ( fn, ms, ctx ) => {
    let timer = 0;

    const cancel = () => {
        clearTimeout( timer );
        timer = 0;
    }

    const invoke = () => {
        timer = 0;
        fn.call( ctx );
    }

    const throttled = () => {
        if( timer === 0 ){
            timer = setTimeout( invoke, ms );
        }
    }

    throttled._cancel = cancel;

    return throttled;
}

export default throttle;