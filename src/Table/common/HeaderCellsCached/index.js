import React from "react";
import useApi from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "sort-params-changed"
];

const SortDirections = {
    "1": "ascending",
    "-1": "descending"
};

/*
    TODO:
        When rowCount is 0 - render th's of auto width.
*/
const HeaderCells = () => {

    const { columns, sortColumnIndex, sortDirectionSign } = useApi( SUBSCRIBE_EVENTS );

    return columns.map(({ dataKey, title, sort, label, visibility }, j ) => visibility === "hidden" ? null : (
        <th
            key={dataKey}
            title={title}
            data-sortable={sort?"":undefined}
            aria-colindex={j+1}
            aria-sort={sortColumnIndex!==j?"none":SortDirections[sortDirectionSign]}
        >
            {label}
        </th>
    ));
};

const HeaderCellsCached = <HeaderCells />;

export default HeaderCellsCached;