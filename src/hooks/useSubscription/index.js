import { useRef, useEffect } from "react";
import useForceUpdate from "../useForceUpdate";
import useApi from "../useApi";

const useSubscription = ( callBack, events ) => {
    
    const prevRenrerRef = useRef( null );
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
        prevRenrerRef.current = callBack( API );
    }
    
    return prevRenrerRef.current;
}

export default useSubscription;