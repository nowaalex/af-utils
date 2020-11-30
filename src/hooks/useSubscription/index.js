import { useRef, useEffect } from "react";
import useForceUpdate from "../useForceUpdate";
import useApi from "../useApi";

const useSubscription = ( callBack, events ) => {
    
    const prevRenderRef = useRef( null );
    const API = useApi();
    const forceUpdate = useForceUpdate();
    
    useEffect(() => {
        API.on( forceUpdate, ...events );
        return () => API.off( forceUpdate, ...events );
    }, events );

    if( API.inBatch ){
        /*
            Somebody tried to rerender, while we were in batch.
            On batch finish component definitely must be rerendered.
        */
        API.queue( forceUpdate );
    }
    else{
        prevRenderRef.current = callBack( API );
    }
    
    return prevRenderRef.current;
}

export default useSubscription;