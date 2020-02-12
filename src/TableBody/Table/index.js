import React, { memo } from "react";
import Colgroup from "./Colgroup";
import Rows from "./Rows";
import { useApiPlugin } from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "virtual-top-offset-changed"
];

const Table = memo(({
    EmptyDataRowComponent,
    getRowData,
    getRowKey,
    getRowExtraProps,
    tbodyRef,
    tableLayoutFixed
}) => {
    const { virtualTopOffset } = useApiPlugin( SUBSCRIBE_EVENTS );

    /* Hmm, I can't put translateY more than ~ 3 000 000. Maybe need to figure this out) */

    return (
        <table style={{ tableLayout: tableLayoutFixed ? "fixed" : "auto", transform: `translateY(${virtualTopOffset}px)` }}>
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
    );
});

export default Table;