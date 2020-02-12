import React, { memo } from "react";
import PropTypes from "prop-types";
import { css } from "@emotion/core";
import styled from "@emotion/styled";
import Context from "./Context";
import TableBody from "./TableBody";
import TableHead from "./TableHead";
import VirtualRowsDataStore from "./VirtualRowsDataStore";


/* flex: 1 1 auto, assuming that table would be used full-stretch mostly */
const wrapperCss = css`
    display: flex;
    flex: 1 1 auto;
    flex-flow: column nowrap;
    overflow: hidden;
`;

export const EmptyDataRowComponentDefault = memo(({ columns }) => (
    <tr>
        <td colSpan={columns.length}>&mdash;</td>
    </tr>
));

export const RowCountWarningContainerDefault = styled.div`
    flex: 1 1 auto;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const getRowExtraPropsDefault = () => undefined;

/*
    If we provide a ref to a class component, we could access Data and call it's methods from outside( Data.scrollTo(), etc. ).
    Functional components encapsulate internals, so to keep this flexibility we use class components here.
*/
class Table extends React.PureComponent {

    scrollContainerRef = React.createRef();
    tbodyRef = React.createRef();

    Data = new VirtualRowsDataStore({
        overscanRowsDistance: this.props.overscanRowsDistance,
        columns: this.props.columns,
        totalRows: Math.max( this.props.rowCount, 0 ),
        estimatedRowHeight: this.props.estimatedRowHeight,
        getTbodyDomNode: () => this.tbodyRef.current,
        getScrollContainerNode: () => this.scrollContainerRef.current
    });

    componentDidUpdate( prevProps ){
        const { rowCount, columns, estimatedRowHeight } = this.props;
        if( rowCount >= 0 && rowCount !== prevProps.rowCount ){
            this.Data.setTotalRows( rowCount );
        }
        if( columns !== prevProps.columns ){
            this.Data.setColumns( columns );
        }
        if( estimatedRowHeight !== prevProps.estimatedRowHeight ){
            this.Data.setEstimatedRowHeight( estimatedRowHeight );
        }
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
            tableLayoutFixed,
            estimatedRowHeight,
            overscanRowsDistance,
            rowCountWarningsTable,

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
                            scrollContainerRef={this.scrollContainerRef}
                            tbodyRef={this.tbodyRef}
                            tableLayoutFixed={tableLayoutFixed}
                            EmptyDataRowComponent={EmptyDataRowComponent}
                            getRowData={getRowData}
                            getRowKey={getRowKey}
                            getRowExtraProps={getRowExtraProps}
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

    getRowKey: PropTypes.func,
    estimatedRowHeight: PropTypes.number,
    getRowExtraProps: PropTypes.func,

    /* as row heights may be different, we measure overscan in px */
    overscanRowsDistance: PropTypes.number,
    tableLayoutFixed: PropTypes.bool,

    HeaderRowComponent: PropTypes.element,
    EmptyDataRowComponent: PropTypes.element,

    RowCountWarningContainer: PropTypes.element,
    rowCountWarningsTable: PropTypes.object
};

Table.defaultProps = {
    estimatedRowHeight: 20,
    getRowExtraProps: getRowExtraPropsDefault,
    overscanRowsDistance: 200,
    tableLayoutFixed: false,

    EmptyDataRowComponent: EmptyDataRowComponentDefault,
    RowCountWarningContainer: RowCountWarningContainerDefault
};

export default Table;