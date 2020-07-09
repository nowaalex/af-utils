import React, { memo } from "react";
import Rows from "./Rows";

const Tbody = ({
    getRowExtraProps,
    getCellExtraProps,
    tbodyRef,
    RowComponent,
    CellComponent
}) => (
    <tbody ref={tbodyRef}>
        <Rows
            getRowExtraProps={getRowExtraProps}
            getCellExtraProps={getCellExtraProps}
            RowComponent={RowComponent}
            CellComponent={CellComponent}
        />
    </tbody>
);

export default memo( Tbody );