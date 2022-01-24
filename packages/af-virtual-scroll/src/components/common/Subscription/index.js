import { useRef, useReducer } from "react";
import useSubscription from "hooks/useSubscription";

const inc = x => x + 1;

const Subscription = ({ model, children }) => {

    const [ forceUpdateRenderCounter, forceUpdate ] = useReducer( inc, 1 );

    useSubscription( model, forceUpdate );

    const prevRenderRef = useRef( null );
    const renderCounterRef = useRef( 0 );

    if( renderCounterRef.current !== forceUpdateRenderCounter ){
        renderCounterRef.current = forceUpdateRenderCounter;
        prevRenderRef.current = children( model );
    }
    else {
        model._queue( forceUpdate );
    }

    return prevRenderRef.current;
}


export default Subscription;