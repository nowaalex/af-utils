import { useRef, useLayoutEffect } from "react";
import Table from "models/Table";
import { RowDataGetter, RowKeyGetter } from "types";
import { ColumnDefinition } from "models/Columns/Column";

type Params = {
    rowCount: number;
    columns: ColumnDefinition[];
    getRowData: RowDataGetter;
    getRowKey: RowKeyGetter;
};

const useTable = ({ columns, rowCount, getRowData, getRowKey }: Params) => {
    const model = (useRef<Table>().current ||= new Table(
        columns,
        rowCount,
        getRowData,
        getRowKey
    ));

    useLayoutEffect(() => {
        model.set(columns, rowCount, getRowData, getRowKey);
    });

    return model;
};

export default useTable;
