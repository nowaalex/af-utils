import { useRef, useEffect, useReducer } from "react";
import { EMPTY_ARRAY } from "constants";

const increment = x => x + 1;

const useForceUpdate = () => useReducer( increment, 0 )[ 1 ];

const Subscription = ({ model, children }) => {

    const prevRenderRef = useRef( null );
    const forceUpdate = useForceUpdate();
    
    useEffect(() => {
        model._sub( forceUpdate );
        return () => model._unsub( forceUpdate );
    }, EMPTY_ARRAY);

    if( model._inBatch === 0 ){
        prevRenderRef.current = children( model );
    }
    else{
        model._queue( forceUpdate );
    }
    
    return prevRenderRef.current;
}


export default Subscription;