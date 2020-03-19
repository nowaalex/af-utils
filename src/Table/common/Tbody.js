import React, { memo } from "react";
import Rows from "./Rows";

const Tbody = ({
    getRowExtraProps,
    tbodyRef,
    RowComponent,
    CellComponent
}) => (
    <tbody ref={tbodyRef}>
        <Rows
            getRowExtraProps={getRowExtraProps}
            RowComponent={RowComponent}
            CellComponent={CellComponent}
        />
    </tbody>
);

export default memo( Tbody );