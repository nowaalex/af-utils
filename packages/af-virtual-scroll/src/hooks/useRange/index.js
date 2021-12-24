import { useEffect } from "react";
import { EMPTY_ARRAY } from "constants";
import ListBase from "models/ListBase";

const useRange = ( model, event, deps = EMPTY_ARRAY ) => useEffect(() => {
    const finalModel = model instanceof ListBase ? model : model.current;
    if( finalModel && event ){
        const evt = () => event( finalModel );
        evt();
        finalModel._sub( evt );
        return () => finalModel._unsub( evt );
    }
}, deps );

export default useRange;