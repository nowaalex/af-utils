import { memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";

const HEADER_CELLS_SUBSCRIPTIONS = [ "normalizedVisibleColumns" ];

const HeaderCells = () => useModelSubscription( HEADER_CELLS_SUBSCRIPTIONS ).normalizedVisibleColumns.map(({ label, dataKey, title }, index ) => (
    <th
        key={dataKey}
        title={title}
        aria-colindex={index+1}
    >
        {label}
    </th>
));

export default memo( HeaderCells, () => true );