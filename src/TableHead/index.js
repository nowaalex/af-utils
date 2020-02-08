import React, { memo } from "react";
import { css } from "@emotion/core";
import Colgroup from "../TheadColgroup";
import { useApiPlugin } from "../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed",
    "column-widths-changed",
];

/*
    border-box is important, because head th widths are synced with td widths
    width: 100% covers case, when no tbody is rendered and exact width cannot be calculated
*/
const wrapperCss = css`
    flex: 0 0 auto;
    min-width: 100%;
    position: relative;
    table-layout: fixed;
    th {
        text-overflow: ellipsis;
        overflow: hidden;
        box-sizing: border-box;
    }
`;


const TableHead = memo(() => {

    const { columns, scrollLeft, tbodyColumnWidths } = useApiPlugin( SUBSCRIBE_EVENTS );

    return (
        <table css={wrapperCss} style={{ right: scrollLeft }}>
            <Colgroup />
            <thead>
                <tr>
                    {columns.map(( column, j, cols ) => {
                        const width = tbodyColumnWidths[ j ];
                        const style = j + 1 < cols.length ? { minWidth: width, width, maxWidth: width } : { minWidth: width };
                        return (
                            <th key={column.dataKey} style={style}>
                                {column.label}
                            </th>
                        );
                    })}
                </tr>
            </thead>
        </table>
    );
}, () => true );

export default TableHead;