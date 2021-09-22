import { useEffect } from "react";
import {
    EVT_RANGE,
    EVT_ROWS_QUANTITY
} from "constants/events";

const useRange = ( modelRef, event, deps = [] ) => useEffect(() => {
    const model = modelRef.current;
    if( event ){
        const evt = () => event( model );
        evt();
        model.on( evt, EVT_ROWS_QUANTITY, EVT_RANGE );
        return () => model.off( evt, EVT_ROWS_QUANTITY, EVT_RANGE );
    }
}, deps );

export default useRange;