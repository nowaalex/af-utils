import React from "react";

const Cell = ({ rowData, columnIndex, column }) => {
    const { transformCellData, dataKey } = column;
    const cellData = rowData[ dataKey ];
    return (
        <td key={dataKey}>
            {transformCellData?transformCellData(cellData,rowData,columnIndex):cellData}
        </td>
    );
};

export default Cell;