import React from "react";
import useApi from "../../useApi";
import { observer } from "mobx-react-lite";

const HeaderCells = () => {

    const { columns, Rows } = useApi();
    const { sort } = Rows.aggregators;

    return columns.map(({ dataKey, title, sort: colSort, label, visibility }, j ) => visibility === "hidden" ? null : (
        <th
            key={dataKey}
            title={title}
            data-sortable={colSort?"":undefined}
            aria-colindex={j+1}
            aria-sort={sort&&sort.dataKey === dataKey?sort.value:"none"}
        >
            {label}
        </th>
    ));
};

export default observer( HeaderCells );