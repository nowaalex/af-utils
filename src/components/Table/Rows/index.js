import { memo, useLayoutEffect } from "react";
import useModelSubscription from "hooks/useModelSubscription";

const ROWS_SUBSCRIPTIONS = [ "startIndex", "endIndex", "normalizedVisibleColumns" ];

const Rows = ({ renderRow, getRowData, renderCell, CellsList, Cell }) => {

    const API = useModelSubscription( ROWS_SUBSCRIPTIONS );
    const { startIndex, endIndex, normalizedVisibleColumns } = API;
    const result = [];

    for( let i = startIndex; i < endIndex; i++ ){
        result.push( renderRow( i, normalizedVisibleColumns, getRowData, renderCell, CellsList, Cell ) );
    }

    useLayoutEffect(() => API.setRenderedStartIndex( startIndex ));

    return result;
};

export default memo( Rows );