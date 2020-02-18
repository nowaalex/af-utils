import React, { memo } from "react";
import { css } from "@emotion/core";
import Colgroup from "./Colgroup";
import Rows from "./Rows";
import { useApiPlugin } from "../../useApi";

const SUBSCRIBE_EVENTS = [
    "virtual-top-offset-changed",
    "total-rows-changed"
];

const tableBaseCss = css`
    && {
        contain: paint;
        width: 100%;
        will-change: transform;
    }
`;

const fixedTableCss = css`
    ${tableBaseCss};
    && {
        table-layout: fixed;
    }
`;

const autoTableCss = css`
    ${tableBaseCss};
    && {
        table-layout: auto;
    }
`;

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
        transform: `translateY(${virtualTopOffset}px)`
    };

    return (
        <table css={fixedLayout?fixedTableCss:autoTableCss} aria-rowcount={totalRows} style={tableStyle}>
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