import { useRef, useReducer, memo } from "react";
import useSubscription from "hooks/useSubscription";
import { EVT_ALL, FORCEUPDATE_MODULO } from "constants";

/*
    Increment just x + 1 may result in NaN theoretically, so modulo should be used.
    Smth like ( x + 1 ) % 100000
    But modulo is slow, so using bitwise & is a way to optimize it.
    m % n equals m & ( n - 1 ) if n is a power of 2.
*/
const inc = x => (x + 1) & FORCEUPDATE_MODULO;

const Subscription = ({ model, children, events = EVT_ALL }) => {
    const [forceUpdateRenderCounter, forceUpdate] = useReducer(inc, 1);
    const lastRenderCounterRef = useRef(0);
    const prevRenderRef = useRef(null);

    useSubscription(model, forceUpdate, events);

    if (lastRenderCounterRef.current !== forceUpdateRenderCounter) {
        lastRenderCounterRef.current = forceUpdateRenderCounter;
        prevRenderRef.current = children(model);
    } else {
        model._Queue.add(forceUpdate);
    }

    return prevRenderRef.current;
};

export default memo(Subscription);
