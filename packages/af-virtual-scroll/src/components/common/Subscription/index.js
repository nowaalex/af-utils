import { useReducer, useEffect } from "react";
import { EMPTY_ARRAY } from "constants";

const increment = x => x + 1;

const useForceUpdate = () => useReducer( increment, 0 )[ 1 ];

const Subscription = ({ model, children }) => {

    const forceUpdate = useForceUpdate();
    
    useEffect(() => {
        model._sub( forceUpdate );
        return () => model._unsub( forceUpdate );
    }, EMPTY_ARRAY);

    return children( model );
}


export default Subscription;