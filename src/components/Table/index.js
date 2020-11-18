import { memo } from "react";
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
import HeaderCells from "./HeaderCells";

import {
    renderRow,
    renderCell,
    CellsList,
    Cell,
    HeaderCell
} from "./renderers";

import css from "./style.module.scss";

/*
    Todo:
        * measure thead & tfoot heights in order to properly calculate available space for rows
        * think about border-collapse offsetHeight issue
        * maybe throw border-collapse
*/


const Table = ({
    fixed,
    estimatedRowHeight,
    columns,
    getRowData,
    renderRow,
    renderCell,
    CellsList,
    Cell,
    HeaderCell,
    rowsQuantity,
    overscanRowsCount,
    headless,
    dataRef,
    className,
    onHeaderCellClick,
    ...props
}) => {

    const [ Store, rowsContainerRef ] = useModel( fixed ? FixedTable : VariableTable, dataRef, {
        overscanRowsCount,
        estimatedRowHeight,
        columns,
        rowsQuantity
    });
    
    return (
        <Context.Provider value={Store}>
            <ScrollContainer className={cx(css.wrapper,className)} {...props}>
                <table className={css.bodyTable}>
                    <Colgroup />
                    {headless?null:(
                        <thead>
                            <tr>
                                <HeaderCells onClick={onHeaderCellClick} HeaderCell={HeaderCell} />
                            </tr>
                        </thead>
                    )}
                    <Scroller as={<tbody />} />
                    <tbody ref={rowsContainerRef}>
                        <Rows
                            getRowData={getRowData}
                            renderRow={renderRow}
                            renderCell={renderCell}
                            CellsList={CellsList}
                            Cell={Cell}
                        />
                    </tbody>
                </table>
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

    getRowData: PropTypes.func.isRequired,

    renderRow: PropTypes.func,
    renderCell: PropTypes.func,
    CellsList: PropTypes.elementType,
    Cell: PropTypes.elementType,
    HeaderCell: PropTypes.elementType,

    headless: PropTypes.bool,
};

Table.defaultProps = {
    headless: false,
    fixed: false,
    estimatedRowHeight: 20,
    overscanRowsCount: 4,

    renderRow,
    renderCell,
    CellsList,
    Cell,
    HeaderCell
};

export default memo( Table );