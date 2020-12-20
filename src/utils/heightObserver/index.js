const callBacks = new Map();

const R = new ResizeObserver( entries => {
    for( let entry of entries ){
        const cb = callBacks.get( entry.target );
        if( cb ){
            cb( Math.round( entry.contentRect.height ) )
        }
    }
});

export const observe = ( el, callBack ) => {
    callBacks.set( el, callBack );
    R.observe( el );
}

export const unobserve = el => callBacks.delete( el ) && R.unobserve( el );