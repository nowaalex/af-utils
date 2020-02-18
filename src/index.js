import React, { memo } from "react";
import PropTypes from "prop-types";
import { css } from "@emotion/core";

import Context from "./Context";
import TableBody from "./TableBody";
import TableHead from "./TableHead";
import VirtualTableDataStore from "./models/Table";

import RowComponentDefault from "./defaultComponents/Row";
import CellComponentDefault from "./defaultComponents/Cell";
import RowCountWarningContainerDefault from "./defaultComponents/RowCountWarningContainer";


/*
    * flex: 1 1 auto, assuming that table would be used full-stretch mostly
    * border-box is important, because head th widths are synced with td widths
    width: 100% covers case, when no tbody is rendered and exact width cannot be calculated
*/
const wrapperCss = css`
    display: flex;
    flex: 1 1 auto;
    flex-flow: column nowrap;
    overflow: hidden;
    &, table, tr, td, th {
        box-sizing: border-box;
    }
`;


/*
    If we provide a ref to a class component, we could access Data and call it's methods from outside( Data.scrollTo(), etc. ).
    Functional components encapsulate internals, so to keep this flexibility we use class components here.
*/
class Table extends React.PureComponent {

    scrollContainerRef = React.createRef();
    tbodyRef = React.createRef();

    constructor( props ){
        super( props );

        this.Data = new VirtualTableDataStore({
            overscanRowsDistance: props.overscanRowsDistance,
            columns: props.columns,
            totalRows: props.rowCount,
            estimatedRowHeight: props.estimatedRowHeight,
            getRowsContainerNode: () => this.tbodyRef.current,
            getScrollContainerNode: () => this.scrollContainerRef.current
        });
    }
    
    componentDidUpdate(){
        const { rowCount, columns, estimatedRowHeight, overscanRowsDistance } = this.props;
        this.Data
            .setOverscanRowsDistance( overscanRowsDistance )
            .setColumns( columns )
            .setTotalRows( rowCount )
            .setEstimatedRowHeight( estimatedRowHeight );        
    }

    componentWillUnmount(){
        this.Data.destructor();
    }

    render(){

        const {
            columns,
            getRowData,
            getRowKey,
            getRowExtraProps,
            rowCount,
            estimatedRowHeight,
            overscanRowsDistance,
            rowCountWarningsTable,
            fixedLayout,

            RowComponent,
            CellComponent,
            RowCountWarningContainer,

            ...props
        } = this.props;

        return (
            <Context.Provider value={this.Data}>
                <div css={wrapperCss} {...props}>
                    <TableHead />
                    { rowCount > 0 ? (
                        <TableBody
                            scrollContainerRef={this.scrollContainerRef}
                            tbodyRef={this.tbodyRef}
                            getRowData={getRowData}
                            getRowKey={getRowKey}
                            getRowExtraProps={getRowExtraProps}
                            RowComponent={RowComponent}
                            CellComponent={CellComponent}
                            fixedLayout={fixedLayout}
                        />
                    ) : rowCountWarningsTable ? (
                        <RowCountWarningContainer>
                            {rowCountWarningsTable[rowCount]}
                        </RowCountWarningContainer>
                    ) : null }
                </div>
            </Context.Provider>
        );
    };
}

Table.propTypes = {
    columns: PropTypes.array.isRequired,
    getRowData: PropTypes.func.isRequired,

    rowCount: PropTypes.number,
    getRowKey: PropTypes.func,
    estimatedRowHeight: PropTypes.number,
    getRowExtraProps: PropTypes.func,

    /* as row heights may be different, we measure overscan in px */
    overscanRowsDistance: PropTypes.number,

    HeaderRowComponent: PropTypes.any,
    RowComponent: PropTypes.any,
    CellComponent: PropTypes.any,

    RowCountWarningContainer: PropTypes.any,
    rowCountWarningsTable: PropTypes.object,
    fixedLayout: PropTypes.bool
};

Table.defaultProps = {
    rowCount: 0,
    estimatedRowHeight: 20,
    overscanRowsDistance: 200,
    fixedLayout: false,

    /*
        For 90% non-reactive solutions, which only provide new getRowData when data is changed, memo is ok.
        If RowComponent should be wrapped my mobx observer - non-memo version should be imported.
        memo(observer(RowComponentDefault)) will do the trick.
    */
    RowComponent: memo( RowComponentDefault ),
    CellComponent: CellComponentDefault,
    RowCountWarningContainer: RowCountWarningContainerDefault,
};

export default Table;