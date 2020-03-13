import React from "react";
import PropTypes from "prop-types";

const Row = ({ columns, CellComponent, getRowData, getRowExtraProps, rowDataIndex, rowIndex }) => {

    const rowData = getRowData( rowDataIndex );

    /* avoiding double destructurization via getRowExtraProps, so making prop object once */
    const trProps = {
        "aria-rowindex": rowIndex + 1
    };

    if( getRowExtraProps ){
        const extraProps = getRowExtraProps( rowData, rowDataIndex );
        if( process.env.NODE_ENV !== "production" ){
            if( extraProps.hasOwnProperty( "aria-rowindex" ) ){
                throw new Error( "getExtraProps must not override aria-rowindex" );
            }
        }
        Object.assign( trProps, extraProps );
    }

    return (
        <tr {...trProps}>
            {columns.map(( column, columnIndex ) => column.visibility !== "hidden" ? (
                <CellComponent
                    key={column.dataKey}
                    rowData={rowData}
                    rowIndex={rowIndex}
                    column={column}
                    columnIndex={columnIndex}
                />
            ) : null )}
        </tr>
    );
};

Row.propTypes = {
    columns: PropTypes.array.isRequired,
    CellComponent: PropTypes.oneOfType([ PropTypes.func, PropTypes.node ]).isRequired,
    getRowData: PropTypes.func.isRequired,
    rowIndex: PropTypes.number.isRequired,
    rowDataIndex: PropTypes.number.isRequired,
    getRowExtraProps: PropTypes.func
};

export default Row;