import React, { memo, useMemo } from "react";
import areEqualBy from "../utils/areEqualBy";

const MEMO_PROPS = [
    "bodyScrollLeft",
    "tbodyColumnWidths",
    "height",
    "width",
    "TableHeaderWrapperComponent",
    "HeaderRowComponent",
    "HeaderCellComponent",
    "VirtualizedTableCellHeightControllerComponent",
    "TheadComponent",
    "columns",
    "getHeaderCellData",
    "TableComponent"
];

const TableHead = memo(({
    bodyScrollLeft,
    tbodyColumnWidths,
    height,
    width,
    TableHeaderWrapperComponent,
    HeaderRowComponent,
    HeaderCellComponent,
    VirtualizedTableCellHeightControllerComponent,
    TheadComponent,
    columns,
    getHeaderCellData,
    TableComponent
}) => {

    const cells = useMemo(() => columns.map(( column, j, columns ) => {
        const cellData = getHeaderCellData( column, j, columns );
        return (
            <HeaderCellComponent key={column.dataKey}>
                { height ? (
                    <VirtualizedTableCellHeightControllerComponent style={{ height, maxHeight: height }}>
                        {cellData}
                    </VirtualizedTableCellHeightControllerComponent>
                ) : cellData}
            </HeaderCellComponent>
        )
    }), [ columns, getHeaderCellData, HeaderCellComponent, height ]);

    const colGroupComponent = useMemo(() => (
        <colgroup>
            {columns.map(({ dataKey, background, visibility, border }, i ) => <col key={dataKey} style={{
                width: tbodyColumnWidths[ i ],
                background,
                visibility,
                border
            }} /> )}
        </colgroup>
    ), [ tbodyColumnWidths, columns ]);

    const tableComponentStyle = useMemo(() => ({
        position: "relative",
        right: bodyScrollLeft,
        tableLayout: "fixed",
        width
    }), [ bodyScrollLeft, width ]);

    const wrapperStyle = useMemo(() => ({ width, height }), [ width, height ]);

    return (
        <TableHeaderWrapperComponent style={wrapperStyle}>
            <TableComponent style={tableComponentStyle}>
                {colGroupComponent}
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