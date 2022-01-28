import PropTypes from "prop-types";
import cx from "utils/cx";
import Subscription from "components/Subscription";
import mapVisibleRange from "utils/mapVisibleRange";


import Colgroup from "./Colgroup";

import {
    renderRow,
    Row,
    renderHeaderCells,
    Cell
} from "./renderers";

import "style/style.scss";
import css from "./style.module.scss";

/*
    Todo:
        * think about border-collapse offsetHeight issue ( maybe throw border-collapse )
*/

const Table = ({
    model,
    columns,
    getRowData,
    getRowProps,
    renderRow,
    Row,
    renderHeaderCells,
    renderTfootContent,
    Cell,
    headless,
    className,
    ...props
}) => {
    const extraProps = { columns, getRowData, getRowProps, Row, Cell };
    return (
        <div className={cx("afvscr-table",className)} ref={model.setOuterNode} {...props}>
            <Subscription model={model}>
                {({ scrollSize: height }) => <div className={css.topSpacer} style={{ height }} /> }
            </Subscription>
            <table>
                <Colgroup columns={columns} />
                {headless ? null : (
                    <thead>
                        <tr>
                            {renderHeaderCells(columns)}
                        </tr>
                    </thead>
                )}
                <tbody>
                    <Subscription model={model}>
                        {({ from }) =>  (
                            <>
                                <tr
                                    className={css.spacer}
                                    ref={model.setZeroChildNode}
                                    style={{ height: model.getOffset(from) }} 
                                />
                                {mapVisibleRange( model, i => renderRow( i, extraProps ) )}
                            </>
                        )}
                    </Subscription>
                </tbody>
                {renderTfootContent ? (
                    <tfoot>
                        {renderTfootContent( columns )}
                    </tfoot>
                ) : null}
            </table>
        </div>
    );
}

Table.propTypes = {
    className: PropTypes.string,
    columns: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
                PropTypes.shape({
                // unique key for column
                dataKey: PropTypes.string.isRequired,

                // for details see CellComponent implementation
                format: PropTypes.func,
                render: PropTypes.func,
                formatTotal: PropTypes.func,
                totals: PropTypes.string,

                // column props, affecting colgroup > col tags
                background: PropTypes.string,
                border: PropTypes.string,
                width: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
                
                // works pretty shitty in col tag
                minWidth: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
                CellComponent: PropTypes.elementType,
                getCellExtraProps: PropTypes.func
            })
        ])
    ).isRequired,

    getRowData: PropTypes.func.isRequired,
    getRowProps: PropTypes.func,
    renderTfootContent: PropTypes.func,
    renderHeaderCells: PropTypes.func,
    Row: PropTypes.elementType,
    Cell: PropTypes.elementType,

    headless: PropTypes.bool,
};


Table.defaultProps = {
    headless: false,
    renderRow,
    Row,
    renderHeaderCells,
    Cell
};

export default Table;