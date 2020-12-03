import { memo, useState, useMemo } from "react";
import PropTypes from "prop-types";

import commonDefaultProps from "../common/defaultProps";

import cx from "utils/cx";
import startCase from "utils/startCase";

import Context from "Context";
import useModel from "hooks/useModel";
import useNormalizedTableColumns from "hooks/useNormalizedTableColumns";

import VariableHeightsStore from "models/VariableSizeList";
import FixedHeightsStore from "models/FixedSizeList";

import ScrollContainer from "../common/ScrollContainer";

import Scroller from "./Scroller";
import Rows from "./Rows";
import Colgroup from "./Colgroup";

import {
    renderRow,
    renderCell,
    renderHeaderCells,
    renderFooter,
    CellsList,
    Cell
} from "./renderers";

import css from "./style.module.scss";

/*
    Todo:
        * measure thead & tfoot heights in order to properly calculate available space for rows
        * think about border-collapse offsetHeight issue ( maybe throw border-collapse )
*/

const Table = ({
    fixed,
    estimatedRowHeight,
    columns,
    getRowData,
    renderRow,
    renderCell,
    renderHeaderCells,
    renderFooter,
    CellsList,
    Cell,
    rowsQuantity,
    overscanRowsCount,
    headless,
    dataRef,
    className,
    ...props
}) => {

    const [ rowsContainerNode, rowsContainerRef ] = useState();

    const Store = useModel(
        fixed ? FixedHeightsStore : VariableHeightsStore,
        dataRef,
        estimatedRowHeight,
        overscanRowsCount,
        rowsQuantity,
        rowsContainerNode
    );

    const normalizedVisibleColumns = useNormalizedTableColumns( columns );
    
    const finalColumns = useMemo(() => normalizedVisibleColumns.map( column => ({
        label: startCase( column.dataKey ),
        ...column
    })), normalizedVisibleColumns );
        
    return (
        <Context.Provider value={Store}>
            <ScrollContainer className={cx(css.wrapper,className)} {...props}>
                <table className={css.bodyTable}>
                    <Colgroup columns={finalColumns} />
                    {headless ? null : (
                        <thead>
                            <tr>
                                {renderHeaderCells(finalColumns)}
                            </tr>
                        </thead>
                    )}
                    <Scroller />
                    <tbody ref={rowsContainerRef}>
                        <Rows
                            columns={finalColumns}
                            getRowData={getRowData}
                            renderRow={renderRow}
                            renderCell={renderCell}
                            CellsList={CellsList}
                            Cell={Cell}
                        />
                    </tbody>
                    {renderFooter( finalColumns )}
                </table>
            </ScrollContainer>
        </Context.Provider>
    );
}

Table.propTypes = {
    rowsQuantity: PropTypes.number.isRequired,
    className: PropTypes.string,
    fixed: PropTypes.bool,
    overscanRowsCount: PropTypes.number,
    estimatedRowHeight: PropTypes.number,
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
                totals: PropTypes.string,
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

    /**
     * @param {number} rowIndex
     * @param {array} columns
     * @param {function} getRowData
     * @param {function} renderCell
     * @param {React.Component} CellsList
     * @param {React.Component} Cell
     * @returns {any} one row element child. Fragments are not supported.
     */
    renderRow: PropTypes.func,
    renderFooter: PropTypes.func,
    renderCell: PropTypes.func,
    renderHeaderCells: PropTypes.func,
    CellsList: PropTypes.elementType,
    Cell: PropTypes.elementType,

    headless: PropTypes.bool,
};

/*
    Spread operator will kill pure annotation comment, and tree-shaking will fail.
    So Object.assign is a must
*/
Table.defaultProps = /*#__PURE__*/ Object.assign({}, commonDefaultProps, {
    headless: false,

    renderRow,
    renderCell,
    renderHeaderCells,
    renderFooter,
    CellsList,
    Cell
});

export default memo( Table );