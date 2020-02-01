import React, { memo, useMemo } from "react";
import Colgroup from "../Colgroup";
import areEqualBy from "../utils/areEqualBy";

const MEMO_PROPS = [
    "bodyScrollLeft",
    "tbodyColumnWidths",
    "width",
    "TableHeaderWrapperComponent",
    "HeaderRowComponent",
    "HeaderCellComponent",
    "TheadComponent",
    "columns",
    "getHeaderCellData",
    "TableComponent"
];

const TableHead = memo(({
    bodyScrollLeft,
    tbodyColumnWidths,
    width,
    TableHeaderWrapperComponent,
    HeaderRowComponent,
    HeaderCellComponent,
    TheadComponent,
    columns,
    getHeaderCellData,
    TableComponent
}) => {

    const cells = useMemo(() => columns.map(( column, j, columns ) => {
        const cellData = getHeaderCellData( column, j, columns );
        return (
            <HeaderCellComponent key={column.dataKey}>
                {cellData}
            </HeaderCellComponent>
        );
    }), [ columns, getHeaderCellData, HeaderCellComponent ]);

    const tableComponentStyle = useMemo(() => ({
        position: "relative",
        right: bodyScrollLeft,
        tableLayout: "fixed",
        width
    }), [ bodyScrollLeft, width ]);

    const wrapperStyle = useMemo(() => ({ width }), [ width ]);

    return (
        <TableHeaderWrapperComponent style={wrapperStyle}>
            <TableComponent style={tableComponentStyle}>
                <Colgroup columns={columns} widthsArray={tbodyColumnWidths} />
                <TheadComponent>
                    <HeaderRowComponent>
                        {cells}
                    </HeaderRowComponent>
                </TheadComponent>
            </TableComponent>
        </TableHeaderWrapperComponent>
        
    );
}, ( p1, p2 ) => areEqualBy( MEMO_PROPS, p1, p2 ) );

export default TableHead;