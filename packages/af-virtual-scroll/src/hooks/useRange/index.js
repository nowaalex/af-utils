import { useEffect } from "react";
import { EMPTY_ARRAY } from "constants";

const useRange = ( model, event, deps = EMPTY_ARRAY ) => useEffect(() => {
    if( model && event ){
        const evt = () => event( model );
        evt();
        model._sub( evt );
        return () => model._unsub( evt );
    }
}, deps );

export default useRange;