const debounce = ( fn, delay, maxWait ) => {

    let timerId,
        lastInvokeStamp = -1 * ( maxWait || 0 );

    const invoke = ( context, stamp ) => {
        fn.call( context );
        lastInvokeStamp = stamp;
        timerId = undefined;
    };

    const cancelPendingCall = () => {
        if( timerId ){
            clearTimeout( timerId );
            timerId = undefined;
        }
    };

    const resultFn = function(){
        cancelPendingCall();
        const stamp = performance.now();
        if( maxWait && stamp - lastInvokeStamp > maxWait ){
            invoke( this, stamp );
        }
        else{
            timerId = setTimeout( invoke, delay, this, stamp );
        }
    };

    resultFn.cancel = cancelPendingCall;

    return resultFn;
};

export default debounce;