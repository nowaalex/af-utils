import { memo, useLayoutEffect } from "react";
import useModelSubscription from "hooks/useModelSubscription";

import {
    START_INDEX,
    END_INDEX
} from "constants/events";

const ROWS_SUBSCRIPTIONS = [ START_INDEX, END_INDEX ];

const Rows = ({ columns, renderRow, getRowData, renderCell, CellsList, Cell }) => {

    const API = useModelSubscription( ROWS_SUBSCRIPTIONS );
    const { startIndex, endIndex } = API;
    const result = [];

    for( let i = startIndex; i < endIndex; i++ ){
        result.push( renderRow( i, columns, getRowData, renderCell, CellsList, Cell ) );
    }

    useLayoutEffect(() => API.setRenderedStartIndex( startIndex ));

    return result;
};

export default memo( Rows );