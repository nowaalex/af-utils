import React, { memo } from "react";
import Colgroup from "./Colgroup";
import Rows from "./Rows";
import { useApiPlugin } from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "virtual-top-offset-changed",
    "total-rows-changed"
];

const CachedColgroup = <Colgroup />;

const Table = memo(({
    getRowData,
    getRowKey,
    getRowExtraProps,
    tbodyRef,
    RowComponent,
    CellComponent,
    fixedLayout
}) => {
    const { virtualTopOffset, totalRows } = useApiPlugin( SUBSCRIBE_EVENTS );


    /* Hmm, I can't put translateY more than ~ 3 000 000. Maybe need to figure this out) */
    const tableStyle = {
        transform: `translateY(${virtualTopOffset}px)`,
        tableLayout: fixedLayout ? "fixed" : undefined
    };

    return (
        <table className="af-react-table-tbody-table" aria-rowcount={totalRows} style={tableStyle}>
            {CachedColgroup}
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