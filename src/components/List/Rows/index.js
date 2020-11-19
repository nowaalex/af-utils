import { memo, useLayoutEffect } from "react";
import useModelSubscription from "hooks/useModelSubscription";

import {
    START_INDEX,
    END_INDEX
} from "constants/events";

const ROWS_SUBSCRIPTIONS = [ START_INDEX, END_INDEX ];

const Rows = ({ renderRow }) => {

    const API = useModelSubscription( ROWS_SUBSCRIPTIONS );
    const { startIndex, endIndex } = API;
    const result = [];

    for( let i = startIndex; i < endIndex; i++ ){
        result.push( renderRow( i ) );
    }

    useLayoutEffect(() => API.setRenderedStartIndex( startIndex ));

    return result;
};

export default memo( Rows );