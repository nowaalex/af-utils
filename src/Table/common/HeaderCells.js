import React from "react";
import useApi from "../../useApi";
import { observer } from "mobx-react-lite";
import HeaderCell from "./HeaderCell";

const HeaderCells = () => useApi().normalizedColumns.map(( column, j ) => (
    <HeaderCell
        key={column.dataKey}
        column={column}
        index={j}
    />
));

export default observer( HeaderCells );