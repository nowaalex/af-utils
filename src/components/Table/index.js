import { memo, useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";

import startCase from "lodash/startCase";

import commonPropTypes from "../common/propTypes";
import cx from "utils/cx";

import Context from "Context";
import useModel from "hooks/useModel";

import VariableHeightsStore from "models/VariableSizeList";
import FixedHeightsStore from "models/FixedSizeList";

import ScrollContainer from "../common/ScrollContainer";
import Scroller from "../common/Scroller";

import Rows from "./Rows";
import Colgroup from "./Colgroup";

import {
    renderRow,
    renderCell,
    renderTheadContents,
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
    renderTheadContents,
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

    const Store = useModel( fixed ? FixedHeightsStore : VariableHeightsStore, dataRef );

    useEffect(() => Store.setViewParams( estimatedRowHeight, overscanRowsCount, rowsQuantity, rowsContainerNode ));

    const normalizedVisibleColumns = useMemo(() => columns.map( column => {
        const finalColumn = typeof column === "string" ? { dataKey: column } : { ...column };

        if( !finalColumn.label ){
            finalColumn.label = startCase( finalColumn.dataKey );
        }

        return finalColumn;
    }), [ columns ]);
    
    return (
        <Context.Provider value={Store}>
            <ScrollContainer className={cx(css.wrapper,className)} {...props}>
                <table className={css.bodyTable}>
                    <Colgroup columns={normalizedVisibleColumns} />
                    {headless?null:(
                        <thead>
                            {renderTheadContents(normalizedVisibleColumns)}
                        </thead>
                    )}
                    <Scroller as={<tbody />} />
                    <tbody ref={rowsContainerRef}>
                        <Rows
                            columns={normalizedVisibleColumns}
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
    renderTheadContents: PropTypes.func,
    CellsList: PropTypes.elementType,
    Cell: PropTypes.elementType,

    headless: PropTypes.bool,
};

Table.defaultProps = {
    headless: false,
    fixed: false,
    estimatedRowHeight: 20,
    overscanRowsCount: 4,

    renderRow,
    renderCell,
    renderTheadContents,
    CellsList,
    Cell
};

export default memo( Table );