import React from "react";
import PropTypes from "prop-types";

const Row = ({ getRowData, getRowExtraProps, rowIndex }) => {

    const rowData = getRowData( rowIndex );

    /* avoiding double destructurization via getRowExtraProps, so making prop object once */
    const wrapperProps = {
        "aria-rowindex": rowIndex + 1
    };

    if( getRowExtraProps ){
        const extraProps = getRowExtraProps( rowData, rowIndex );
        if( extraProps ){
            if( process.env.NODE_ENV !== "production" ){
                if( extraProps.hasOwnProperty( "aria-rowindex" ) ){
                    throw new Error( "getExtraProps must not override aria-rowindex" );
                }
            }
            Object.assign( wrapperProps, extraProps );
        }
    }

    return (
        <div {...wrapperProps}>{rowData}</div>
    );
};

Row.propTypes = {
    getRowData: PropTypes.func.isRequired,
    rowIndex: PropTypes.number.isRequired,
    getRowExtraProps: PropTypes.func
};

export default Row;