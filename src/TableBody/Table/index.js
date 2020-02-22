import React, { memo } from "react";
import { css } from "emotion";
import Colgroup from "./Colgroup";
import Rows from "./Rows";
import { useApiPlugin } from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "virtual-top-offset-changed",
    "total-rows-changed"
];

const tableClass = css`
    contain: paint;
    width: 100%;
    will-change: transform;
    table-layout: auto;
`;

const CachedColgroup = <Colgroup />;

const Table = memo(({
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
        <table className={tableClass} aria-rowcount={totalRows} style={tableStyle}>
            {CachedColgroup}
            <tbody ref={tbodyRef}>
                <Rows
                    getRowExtraProps={getRowExtraProps}
                    RowComponent={RowComponent}
                    CellComponent={CellComponent}
                />
            </tbody>
        </table>
    );
});

export default Table;