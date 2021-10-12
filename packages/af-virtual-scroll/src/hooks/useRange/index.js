import { useEffect } from "react";

const useRange = ( modelRef, event, deps = [] ) => useEffect(() => {
    const model = modelRef.current;
    if( event ){
        const evt = () => event( model );
        evt();
        model._sub( evt );
        return () => model._unsub( evt );
    }
}, deps );

export default useRange;