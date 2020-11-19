import { memo } from "react";
import { START_INDEX, END_INDEX } from "constants/events";
import useSubscription from "hooks/useSubscription";

const E = [ START_INDEX, END_INDEX ];

const Rows = ({ renderRow }) => useSubscription( API => {

    const { startIndex, endIndex } = API;
    const result = [];

    for( let i = startIndex; i < endIndex; i++ ){
        result.push( renderRow( i ) );
    }

    return result;
}, E );

export default memo( Rows );