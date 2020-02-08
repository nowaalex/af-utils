import React, { memo, useMemo } from "react";
import { css } from "@emotion/core";
import Colgroup from "../TheadColgroup";
import { useApiPlugin } from "../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed",
    "column-widths-changed"
];

const wrapperCss = css`
    flex: 0 0 auto;
    overflow: hidden;
    th {
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;

const TableHead = memo(() => {

    const { columns, scrollLeft, tbodyColumnWidths } = useApiPlugin( SUBSCRIBE_EVENTS );

    const tableComponentStyle = useMemo(() => ({
        position: "relative",
        right: scrollLeft,
        tableLayout: "fixed",
    }), [ scrollLeft ]);

    return (
        <div css={wrapperCss}>
            <table style={tableComponentStyle}>
                <Colgroup />
                <thead>
                    <tr>
                        {columns.map(( column, j ) => (
                            <th key={column.dataKey} style={{ maxWidth: tbodyColumnWidths[ j ] || "auto" }}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
            </table>
        </div>
        
    );
}, () => true );

export default TableHead;