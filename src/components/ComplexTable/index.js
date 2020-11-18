import { useState, useEffect, useCallback } from "react";
import RowsAggregator from "models/tables/RowsAggregator";
import useForceUpdate from "hooks/useForceUpdate";
import Table from "../Table";

const ComplexTable = ({ rowsQuantity, getRowData, ...props }) => {

    const propsToMerge = {
        rowsQuantity,
        getRowData
    };

    const [ m ] = useState(() => new RowsAggregator( propsToMerge ) );
    const forceUpdate = useForceUpdate();


    const headerCellClickHandler = useCallback( col => m.sortBy( col.dataKey ), []);

    const renderRow = ( rowIndex, columns, getRowData, renderCell, CellsList, Cell ) => (
        <tr key={rowIndex}>
            <CellsList
                rowIndex={m.orderedRows[rowIndex]}
                columns={columns}
                getRowData={getRowData}
                renderCell={renderCell}
                Cell={Cell}
            />
        </tr>
    );

    useEffect(() => m.merge( propsToMerge ));

    useEffect(() => {
        m.on( forceUpdate, "orderedRows" );
    }, []);

    console.log( "SS")

    return (
        <Table
            onHeaderCellClick={headerCellClickHandler}
            rowsQuantity={rowsQuantity}
            getRowData={getRowData}
            renderRow={renderRow}
            {...props}
        />
    );
}

export default ComplexTable;