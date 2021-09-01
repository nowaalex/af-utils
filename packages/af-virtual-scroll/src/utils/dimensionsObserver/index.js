const callBacks = new Map();

const R = new ResizeObserver( entries => {
    for( const { target } of entries ){
        const cb = callBacks.get( target );
        cb && cb( target );
    }
});

export const observe = ( el, callBack ) => {
    callBacks.set( el, callBack );
    R.observe( el );
}

export const unobserve = el => callBacks.delete( el ) && R.unobserve( el );