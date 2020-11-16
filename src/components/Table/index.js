import React, { memo } from "react";
import PropTypes from "prop-types";

import commonPropTypes from "../common/propTypes";
import cx from "utils/cx";

import Context from "Context";
import useModel from "hooks/useModel";

import FixedTable from "models/tables/SimpleFixed";
import VariableTable from "models/tables/SimpleVariable";


import ScrollContainer from "../common/ScrollContainer";
import Scroller from "../common/Scroller";

import Rows from "./Rows";
import Colgroup from "./Colgroup";
import RowComponentDefault from "./Row";
import CellComponentDefault from "./Cell";
import BodyTable from "./BodyTable";
import HeaderCells from "./HeaderCells";

import css from "./style.module.scss";

/*
    Todo:
        * measure thead & tfoot heights in order to properly calculate available space for rows
        * think about border-collapse offsetHeight issue
*/


const Table = ({
    fixed,
    estimatedRowHeight,
    columns,
    getRowData,
    getCellData,
    getRowKey,
    getRowExtraProps,
    getCellExtraProps,
    rowsQuantity,
    overscanRowsCount,
    headless,
    dataRef,
    className,
    filtering,
    initialGrouping,
    initialExpandedGroups,
    RowComponent,
    CellComponent,
    ...props
}) => {

    const [ Store, rowsContainerRef ] = useModel( fixed ? FixedTable : VariableTable, dataRef, {
        getRowData,
        getCellData,
        getRowKey,
        overscanRowsCount,
        estimatedRowHeight,
        columns,
        rowsQuantity
    });
    
    return (
        <Context.Provider value={Store}>
            <ScrollContainer className={cx(css.wrapper,className)} {...props}>
                <BodyTable>
                    <Colgroup />
                    {headless?null:(
                        <thead>
                            <tr>
                                <HeaderCells />
                            </tr>
                        </thead>
                    )}
                    <Scroller as={<tbody />} />
                    <tbody ref={rowsContainerRef}>
                        <Rows
                            getRowExtraProps={getRowExtraProps}
                            getCellExtraProps={getCellExtraProps}
                            RowComponent={RowComponent}
                            CellComponent={CellComponent}
                        />
                    </tbody>
                </BodyTable>
            </ScrollContainer>
        </Context.Provider>
    );
}

Table.propTypes = {
    ...commonPropTypes,
    columns: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
                PropTypes.shape({
                // unique key for column
                dataKey: PropTypes.string.isRequired,

                // for details see CellComponent implementation
                getCellData: PropTypes.func,
                getEmptyCellData: PropTypes.func,
                format: PropTypes.func,
                render: PropTypes.func,
                formatTotal: PropTypes.func,

                visibility: PropTypes.oneOf([ "visible", "hidden" ]),

                // column props, affecting colgroup > col tags
                background: PropTypes.string,
                border: PropTypes.string,
                width: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
                CellComponent: PropTypes.elementType,
                getCellExtraProps: PropTypes.func
            })
        ])
    ).isRequired,

    getCellExtraProps: PropTypes.func,

    
    headless: PropTypes.bool,

    CellComponent: PropTypes.elementType,
    getCellData: PropTypes.func,
};

Table.defaultProps = {
    headless: false,
    fixed: false,
    estimatedRowHeight: 20,
    overscanRowsCount: 4,

    //    For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
    //    If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
    //    memo(observer(RowComponentDefault)) will do the trick.
    
    RowComponent: memo( RowComponentDefault ),
    CellComponent: CellComponentDefault,
    getCellData: ( rowData, rowIndex, dataKey ) => rowData[ dataKey ],
};

export default memo( Table );