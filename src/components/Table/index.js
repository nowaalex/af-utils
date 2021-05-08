import { memo } from "react";
import PropTypes from "prop-types";
import cx from "utils/cx";

import Rows from "../common/Rows";
import Container from "../common/Container";
import ExtraHeight from "../common/ExtraHeight";

import Colgroup from "./Colgroup";

import {
    renderRow,
    Row,
    renderHeaderCells,
    Cell
} from "./renderers";

import css from "./style.module.scss";

/*
    Todo:
        * think about border-collapse offsetHeight issue ( maybe throw border-collapse )
*/

const Table = ({
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
}) => (
    <Container className={cx(css.wrapper,className)} {...props}>
        {model => (
            <table className={css.bodyTable}>
                <Colgroup columns={columns} />
                {headless ? null : (
                    <ExtraHeight model={model}>
                        <thead>
                            <tr>
                                {renderHeaderCells(columns)}
                            </tr>
                        </thead>
                    </ExtraHeight>
                )}
                <tbody>
                    <Rows
                        model={model}
                        renderRow={renderRow}
                        Spacer="tr"
                        columns={columns}
                        getRowData={getRowData}
                        getRowProps={getRowProps}
                        Row={Row}
                        Cell={Cell}
                    />
                </tbody>
                {renderTfootContent ? (
                    <ExtraHeight model={model}>
                        <tfoot>
                            {renderTfootContent( columns )}
                        </tfoot>
                    </ExtraHeight>
                ) : null}
            </table>
        )}
    </Container>
);

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

export default memo( Table );