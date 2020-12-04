import { memo } from "react";
import useSubscription from "hooks/useSubscription";
import { START_INDEX, END_INDEX } from "constants/events";

const E = [ START_INDEX, END_INDEX ];

const Rows = ({ columns, renderRow, Row, getRowData, getRowProps, renderCell, Cell }) => useSubscription( API => {

    const { startIndex, endIndex } = API;

    const result = [];

    for( let i = startIndex; i < endIndex; i++ ){
        result.push(renderRow({
            index: i,
            columns,
            getRowData,
            getRowProps,
            renderCell,
            Cell,
            Row
        }));
    }

    return result;
}, E );

export default memo( Rows );