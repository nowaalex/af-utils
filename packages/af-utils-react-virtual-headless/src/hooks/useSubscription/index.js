import { useLayoutEffect, useEffect } from "react";
import { EMPTY_ARRAY } from "constants";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/*
    Why useLayoutEffect?

    Subscription must happen immediately after render,
    because model change may happen after render and before useEffect.
    In this case we would miss model update.
*/
const useSubscription = ( model, callBack, events, invokeImmediately, deps ) => useIsomorphicLayoutEffect(() => {
    model.sub( callBack, events );
    if( invokeImmediately ){
        callBack();
    }
    return () => model.unsub( callBack, events );
}, deps || EMPTY_ARRAY );

export default useSubscription;