import { memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";

const HEADER_CELLS_SUBSCRIPTIONS = [ "normalizedVisibleColumns" ];

const HeaderCells = ({ HeaderCell, onClick }) => (
    useModelSubscription( HEADER_CELLS_SUBSCRIPTIONS ).normalizedVisibleColumns.map( column => (
        <HeaderCell
            onClick={onClick}
            key={column.dataKey}
            column={column}
        />
    ))
);

export default memo( HeaderCells );