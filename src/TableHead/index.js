import React, { memo, useMemo } from "react";
import { css } from "@emotion/core";
import Colgroup from "../TheadColgroup";
import { useApiPlugin } from "../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed"
];

const wrapperCss = css`
    flex: 0 0 auto;
    overflow: hidden;
`;

const TableHead = memo(({
    getHeaderCellData,
}) => {

    const { columns, scrollLeft } = useApiPlugin( SUBSCRIBE_EVENTS );

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
                        {columns.map(( column, j, columns ) => (
                            <th key={column.dataKey}>
                                {getHeaderCellData( column, j, columns )}
                            </th>
                        ))}
                    </tr>
                </thead>
            </table>
        </div>
        
    );
});

export default TableHead;