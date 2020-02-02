import React, { memo, useMemo } from "react";
import { css } from "@emotion/core";
import Colgroup from "../Colgroup";

const wrapperCss = css`
    flex: 0 0 auto;
    overflow: hidden;
`;

const TableHead = memo(({
    bodyScrollLeft,
    tbodyColumnWidths,
    width,
    columns,
    getHeaderCellData,
}) => {

    const cells = useMemo(() => columns.map(( column, j, columns ) => {
        const cellData = getHeaderCellData( column, j, columns );
        return (
            <th key={column.dataKey}>
                {cellData}
            </th>
        );
    }), [ columns, getHeaderCellData ]);

    const tableComponentStyle = useMemo(() => ({
        position: "relative",
        right: bodyScrollLeft,
        tableLayout: "fixed",
        width
    }), [ bodyScrollLeft, width ]);

    const wrapperStyle = useMemo(() => ({ width }), [ width ]);

    return (
        <div css={wrapperCss} style={wrapperStyle}>
            <table style={tableComponentStyle}>
                <Colgroup columns={columns} widthsArray={tbodyColumnWidths} />
                <thead>
                    <tr>
                        {cells}
                    </tr>
                </thead>
            </table>
        </div>
        
    );
});

export default TableHead;