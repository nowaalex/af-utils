import React from "react";
import PropTypes from "prop-types";
import { css } from "@emotion/core";
import styled from "@emotion/styled";
import Context from "./Context";
import TableBody from "./TableBody";
import TableHead from "./TableHead";
import VirtualRowsDataStore from "./VirtualRowsDataStore";

/*
    TODO:
        * react on rowCount change
        * react on getRowData change
        * react on overscan prop change
*/

/* flex: 1 1 auto, assuming that table would be used full-stretch mostly */
const wrapperCss = css`
    display: flex;
    flex: 1 1 auto;
    flex-flow: column nowrap;
    overflow: hidden;
`;

export const EmptyDataRowComponentDefault = ({ RowComponent, CellComponent, columns }) => (
    <RowComponent>
        <CellComponent colSpan={columns.length}>&mdash;</CellComponent>
    </RowComponent>
);

export const RowCountWarningContainerDefault = styled.div`
    flex: 1 1 auto;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const mapCellsDefault = ( columns, rowData, DefaultCellComponent, getCellData ) => columns.map(( column, columnIndex, curColumns ) => {
    const cellData = getCellData( rowData, column, columnIndex, curColumns );
    const { transformCellData, dataKey, CellComponent = DefaultCellComponent } = column;
    return (
        <CellComponent key={dataKey}>
            {transformCellData?transformCellData(cellData,rowData,columnIndex):cellData}
        </CellComponent>
    );
});

export const getVisibleRowsDefault = (
    rangeFrom,
    rangeTo,
    columns,
    getRowData,
    getRowKey,
    getRowExtraProps,
    RowComponent,
    mapCells,
    getCellData,
    CellComponent,
    EmptyDataRowComponent
) => {
    const result = [];
    for( let j = rangeFrom, rowData, rowKey; j < rangeTo; j++ ){
        rowData = getRowData( j );
        rowKey = getRowKey ? getRowKey( j ) : j;
        result.push( rowData ? (
            <RowComponent key={rowKey} {...getRowExtraProps( rowData, j )}>
                {mapCells(columns,rowData,CellComponent,getCellData)}
            </RowComponent>
        ) : (
            <EmptyDataRowComponent
                key={rowKey}
                CellComponent={CellComponent}
                RowComponent={RowComponent}
                rowIndex={j}
                columns={columns}
            />
        ));
    }
    return result;
};

export const getCellDataDefault = ( rowData, column ) => rowData[ column.dataKey ];

export const getRowExtraPropsDefault = () => undefined;

class Table extends React.PureComponent {

    tableBodyWrapperRef = React.createRef();
    tableBodyRef = React.createRef();

    Data = new VirtualRowsDataStore({
        columns: this.props.columns,
        getTbodyDomNode: () => this.tableBodyRef.current,
        getTableWrapperDomNode: () => this.tableBodyWrapperRef.current,
        totalRows: this.props.rowCount,
        approximateRowHeight: this.props.approximateRowHeight
    });

    attachTbodyWrapperResizeObserver(){
        if( this.tableBodyWrapperRef.current ){
            /* must behave like useEffect, because children's effects must be performed before */
            this.resizeObserverTimeout = setTimeout(() => {
                this.rsz.observe( this.tableBodyWrapperRef.current );
            }, 0 );
        }
    }

    componentDidMount(){
        this.rsz = new ResizeObserver( entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                this.Data.setWidgetHeight( height );
                this.Data.setWidgetWidth( width );
            }
        });

        this.attachTbodyWrapperResizeObserver();
    }

    onBodyScroll = e => {
        const { scrollLeft, scrollTop } = e.target;
        this.Data.setScrollLeft( scrollLeft );
        this.Data.setScrollTop( scrollTop );
    }

    componentDidUpdate( prevProps ){
        const { rowCount, columns } = this.props;
        if( rowCount !== prevProps.rowCount ){
            this.Data.setTotalRows( rowCount );
            if( prevProps.rowCount <= 0 && rowCount >= 0 ){
                this.attachTbodyWrapperResizeObserver();
            }
        }
        if( columns !== prevProps.columns ){
            this.Data.setColumns( columns );
        }
    }

    componentWillUnmount(){
        this.Data.destructor();
        clearTimeout( this.resizeObserverTimeout );
        if( this.tableBodyWrapperRef.current ){
            this.rsz.unobserve( this.tableBodyWrapperRef.current );
        }
    }

    render(){

        const {
            columns,
            getRowData,
            getRowKey,
            getRowExtraProps,
            getVisibleRows,
            rowCount,
            mapCells,
            getCellData,
            bodyTableLayoutFixed,
            approximateRowHeight,
            overscanRowsDistance,
            rowCountWarningsTable,

            RowComponent,
            CellComponent,
            EmptyDataRowComponent,
            RowCountWarningContainer,

            ...props
        } = this.props;

        return (
            <Context.Provider value={this.Data}>
                <div css={wrapperCss} {...props}>
                    <TableHead />
                    { rowCount > 0 ? (
                        <TableBody
                            wrapperRef={this.tableBodyWrapperRef}
                            tbodyRef={this.tableBodyRef}
                            onScroll={this.onBodyScroll}
                            bodyTableLayoutFixed={bodyTableLayoutFixed}
                            RowComponent={RowComponent}
                            CellComponent={CellComponent}
                            EmptyDataRowComponent={EmptyDataRowComponent}
                            getVisibleRows={getVisibleRows}
                            getRowData={getRowData}
                            getRowKey={getRowKey}
                            getRowExtraProps={getRowExtraProps}
                            mapCells={mapCells}
                            getCellData={getCellData}
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
    rowCount: PropTypes.number.isRequired,
    columns: PropTypes.array.isRequired,
    getRowData: PropTypes.func.isRequired,

    getCellData: PropTypes.func,
    getRowKey: PropTypes.func,
    rowsChangeHash: PropTypes.func,
    approximateRowHeight: PropTypes.number,
    getVisibleRows: PropTypes.func,
    getRowExtraProps: PropTypes.func,
    mapCells: PropTypes.func,
    /* as row heights may be different, we measure overscan in px */
    overscanRowsDistance: PropTypes.number,
    bodyTableLayoutFixed: PropTypes.bool,

    RowComponent: PropTypes.element,
    CellComponent: PropTypes.element,
    HeaderRowComponent: PropTypes.element,
    EmptyDataRowComponent: PropTypes.element,

    RowCountWarningContainer: PropTypes.element,
    rowCountWarningsTable: PropTypes.object
};

Table.defaultProps = {
    approximateRowHeight: 30,
    getVisibleRows: getVisibleRowsDefault,
    getRowExtraProps: getRowExtraPropsDefault,
    mapCells: mapCellsDefault,
    getCellData: getCellDataDefault,
    overscanRowsDistance: 200,
    bodyTableLayoutFixed: false,

    RowComponent: "tr",
    CellComponent: "td",
    EmptyDataRowComponent: EmptyDataRowComponentDefault,
    RowCountWarningContainer: RowCountWarningContainerDefault
};

export default Table;