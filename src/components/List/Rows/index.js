import { memo, useLayoutEffect } from "react";
import useModelSubscription from "hooks/useModelSubscription";

const ROWS_SUBSCRIPTIONS = [ "startIndex", "endIndex" ];

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