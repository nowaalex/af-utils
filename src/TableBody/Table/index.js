import React, { memo } from "react";
import Colgroup from "./Colgroup";
import Rows from "./Rows";
import { useApiPlugin } from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "virtual-top-offset-changed"
];

const Table = memo(({
    getRowData,
    getRowKey,
    getRowExtraProps,
    tbodyRef,
    RowComponent,
    CellComponent,
    fixedLayout
}) => {
    const { virtualTopOffset } = useApiPlugin( SUBSCRIBE_EVENTS );


    /* Hmm, I can't put translateY more than ~ 3 000 000. Maybe need to figure this out) */

    return (
        <table style={{ width: "100%", tableLayout: fixedLayout ? "fixed" : "auto", transform: `translateY(${virtualTopOffset}px)` }}>
            <Colgroup />
            <tbody ref={tbodyRef}>
                <Rows
                    getRowData={getRowData}
                    getRowKey={getRowKey}
                    getRowExtraProps={getRowExtraProps}
                    RowComponent={RowComponent}
                    CellComponent={CellComponent}
                />
            </tbody>
        </table>
    );
});

export default Table;