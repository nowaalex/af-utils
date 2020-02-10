import React, { memo } from "react";
import Colgroup from "./Colgroup";
import Rows from "./Rows";

const Table = memo(({
    EmptyDataRowComponent,
    getRowData,
    getRowKey,
    getRowExtraProps,
    tbodyRef,
    tableLayoutFixed
}) => (
    <table style={{ tableLayout: tableLayoutFixed ? "fixed" : "auto" }}>
        <Colgroup />
        <tbody ref={tbodyRef}>
            <Rows
                EmptyDataRowComponent={EmptyDataRowComponent}
                getRowData={getRowData}
                getRowKey={getRowKey}
                getRowExtraProps={getRowExtraProps}
            />
        </tbody>
    </table>
));

export default Table;