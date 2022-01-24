import { useEffect } from "react";
import { EMPTY_ARRAY } from "constants";

const useSubscription = ( model, callBack, deps = EMPTY_ARRAY ) => useEffect(() => {
    model._sub( callBack );
    return () => model._unsub( callBack );
}, deps );

export default useSubscription;