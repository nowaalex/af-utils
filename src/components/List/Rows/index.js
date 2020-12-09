import { memo } from "react";
import { START_INDEX, END_INDEX } from "constants/events";
import useSubscription from "hooks/useSubscription";

const E = [ START_INDEX, END_INDEX ];

const Rows = ({ dataRef, renderRow }) => useSubscription( API => {

    const { startIndex, endIndex, virtualTopOffset } = API;
    const result = [];

    for( let i = startIndex; i < endIndex; i++ ){
        result.push( renderRow( i ) );
    }

    return (
        <div ref={dataRef} style={{ transform: `translateY(${virtualTopOffset}px)` }}>
            {result}
        </div>
    );
}, E );

export default memo( Rows );