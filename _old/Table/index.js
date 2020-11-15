import React, { useLayoutEffect, useCallback, useEffect, memo } from "react";
import PropTypes from "prop-types";

import Context from "../Context";
import useStore from "../utils/useStore";

import FixedSizeTableStore from "../models/FixedSizeTable";
import VariableSizeTableStore from "../models/VariableSizeTable";



import commonPropTypes from "../commonPropTypes";
import commonDefaultProps from "../commonDefaultProps";
import cx from "../utils/cx";

import castArray from "lodash/castArray";

import ScrollContainer from "../common/ScrollContainer";
import Scroller from "../common/Scroller";

import Rows from "./Rows";
import Colgroup from "./Colgroup";
import RowComponentDefault from "./Row";
import CellComponentDefault from "./Cell";
import TotalsCellComponentDefault from "./TotalsCell";
import BodyTable from "./BodyTable";
import FooterCells from "./FooterCells";
import HeaderCells from "./HeaderCells";

import css from "./style.module.scss";

/*
    Todo:
        measure thead & tfoot heights in order to properly calculate available space for rows
*/


const Table = ({
    fixedSize,
    estimatedRowHeight,
    columns,
    totals,
    getRowData,
    getCellData,
    getRowKey,
    getRowExtraProps,
    getCellExtraProps,
    rows,
    overscanRowsCount,
    headless,
    dataRef,
    className,
    filtering,
    initialGrouping,
    initialExpandedGroups,
    RowComponent,
    CellComponent,
    TotalsCellComponent,
    ...props
}) => {

    const [ Store, scrollContainerRef, tbodyRef ] = useStore( fixedSize ? FixedSizeTableStore : VariableSizeTableStore, dataRef, {
        getRowData,
        getCellData,
        getRowKey,
        overscanRowsCount,
        estimatedRowHeight,
        totals,
        columns,
        rows
    });

    useLayoutEffect(() => {
        if( initialGrouping ){
            Store.Rows.aggregators.addGrouping( ...castArray( initialGrouping ) );
            if( initialExpandedGroups ){
                Store.Rows.resetExpandedState( initialExpandedGroups )
            }
        }
    }, [ Store ]);

    useLayoutEffect(() => {
        Store.Rows.aggregators.setFiltering( filtering );
    }, [ Store, filtering ]);

    const clickHandler = useCallback( e => {

        const node = e.target.closest( "[aria-colindex]" );

        if( process.env.NODE_ENV !== "production" && !node ){
            throw new Error( "colIndex attr missing" );
        }

        const colIndex = parseInt( node.getAttribute( "aria-colindex" ), 10 ) - 1;

        const { sort, dataKey } = Store.columns[ colIndex ];

        if( e.ctrlKey ){
            Store.Rows.aggregators.toggleGrouping( dataKey );
        }
        else if( sort ){
            const value = node.getAttribute( "aria-sort" ) === "ascending" ? "descending" : "ascending";
            Store.Rows.aggregators.setSorting({
                dataKey,
                value
            });
        }
    }, []);


    if( process.env.NODE_ENV !== "production" ){
        /*
            https://bugs.chromium.org/p/chromium/issues/detail?id=702927
        */

        const areTotalsPresent = totals && totals.length !== 0;

        useEffect(() => {
            if( !headless || areTotalsPresent ){
                /* TODO: tests fail without this if */
                if( scrollContainerRef.current ){
                    const table = scrollContainerRef.current.querySelector( "table" );
                    const tableStyle = getComputedStyle( table );
    
                    if( tableStyle.borderCollapse === "collapse" ){
                        console.warn(
                            "You use sticky table version. Due to special border behavior when scrolling, use border-collpase: separate.%o",
                            "https://bugs.chromium.org/p/chromium/issues/detail?id=702927"
                        );
                    }
                }
            }
        }, [ headless, areTotalsPresent ]);
    }
    
    return (
        <Context.Provider value={Store}>
            <ScrollContainer ref={scrollContainerRef} className={cx(css.wrapper,className)} {...props}>
                <BodyTable>
                    <Colgroup />
                    {headless?null:(
                        <thead onClick={clickHandler}>
                            <tr>
                                <HeaderCells />
                            </tr>
                        </thead>
                    )}
                    <Scroller as="tbody" />
                    <tbody ref={tbodyRef}>
                        <Rows
                            getRowExtraProps={getRowExtraProps}
                            getCellExtraProps={getCellExtraProps}
                            RowComponent={RowComponent}
                            CellComponent={CellComponent}
                        />
                    </tbody>
                    {totals && (
                        <tfoot className={className}>
                            <tr>
                                <FooterCells TotalsCellComponent={TotalsCellComponent} />
                            </tr>
                        </tfoot>
                    )}
                </BodyTable>
            </ScrollContainer>
        </Context.Provider>
    );
}

Table.propTypes = {
    ...commonPropTypes,
    columns: PropTypes.arrayOf(
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
            sort: PropTypes.oneOf([ "locale", "numeric" ]),

            // column props, affecting colgroup > col tags
            background: PropTypes.string,
            border: PropTypes.string,
            width: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
            CellComponent: PropTypes.elementType,
            getCellExtraProps: PropTypes.func
        })
    ).isRequired,

    getCellExtraProps: PropTypes.func,

    totals: PropTypes.objectOf(
        // array may contain: "sum", "average", "count", "max", "min"
        PropTypes.array
    ),
    
    headless: PropTypes.bool,

    CellComponent: PropTypes.elementType,
    getCellData: PropTypes.func,
    TotalsCellComponent: PropTypes.elementType,

    initialGrouping: PropTypes.oneOfType([ PropTypes.string, PropTypes.array ]),
    initialExpandedGroups: PropTypes.object,
    filtering: PropTypes.object
};

Table.defaultProps = {
    ...commonDefaultProps,
    headless: false,

    //    For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
    //    If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
    //    memo(observer(RowComponentDefault)) will do the trick.
    
    RowComponent: memo( RowComponentDefault ),
    CellComponent: CellComponentDefault,
    getCellData: ( rowData, rowIndex, dataKey ) => rowData[ dataKey ],
    TotalsCellComponent: TotalsCellComponentDefault
};

export default memo( Table );