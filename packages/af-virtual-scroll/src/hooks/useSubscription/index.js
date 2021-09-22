import { useRef, useEffect, useReducer } from "react";

const increment = x => x + 1;

const useForceUpdate = () => useReducer( increment, 0 )[ 1 ];

const useSubscription = ( model, callBack, events ) => {
    
    const prevRenderRef = useRef( null );
    const forceUpdate = useForceUpdate();
    
    useEffect(() => {
        model.on( forceUpdate, ...events );
        return () => model.off( forceUpdate, ...events );
    }, events );

    if( model._inBatch === 0 ){
        prevRenderRef.current = callBack( model );
    }
    else{
        /*
            Somebody tried to rerender, while we were in batch.
            On batch finish component definitely must be rerendered.
        */
        model._queue( forceUpdate );
    }
    
    return prevRenderRef.current;
}

export default useSubscription;