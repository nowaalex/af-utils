import React from "react";
import useApi from "../../useApi";
import { observer } from "mobx-react-lite";

const HeaderCells = () => {

    const { columns, Rows } = useApi();
    const { dataKey: sortDataKey, value: sortValue } = Rows.modifiers.sort;

    return columns.map(({ dataKey, title, sort, label, visibility }, j ) => visibility === "hidden" ? null : (
        <th
            key={dataKey}
            title={title}
            data-sortable={sort?"":undefined}
            aria-colindex={j+1}
            aria-sort={dataKey !== sortDataKey?"none":sortValue}
        >
            {label}
        </th>
    ));
};

export default observer( HeaderCells );