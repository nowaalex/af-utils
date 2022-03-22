import { useMemo, memo } from "react";
import PropTypes from "prop-types";
import {
    Subscription,
    mapVisibleRange,
    EVT_SCROLL_SIZE,
    EVT_FROM,
    EVT_TO
} from "@af-utils/react-virtual-headless";
import { css, cx } from "@af-utils/styled";
import TableColumn from "models/TableColumn";
import Colgroup from "./Colgroup";
import DEFAULT_COMPONENTS_MAP from "./components";

/*
    Todo:
        * think about border-collapse offsetHeight issue ( maybe throw border-collapse )
*/

const SCROLLSIZE_EVENTS = [ EVT_SCROLL_SIZE ];
const RANGE_EVENTS = [ EVT_FROM, EVT_TO ];

const baseClass = css(
    "overflow: auto",
    "position: relative",
);

const topSpacerClass = css(
    "visibility: hidden",
    "position: absolute",
    "top: 0",
    "left: 0",
    "width: 1px",
);

const hiddenClass = css(
    "visibility: hidden",
);

const tableClass = css(
    "table-layout: fixed",
    "min-width: 100%",
);

const theadClass = css(
    "position: sticky",
    "top: 0",
);

const tfootClass = css(
    "position: sticky",
    "bottom: 0",
);

/* Creating classes for hidden classes optimization */
class RowPropsClass {
    constructor( columns, components, getRowData, getRowProps ){
        this.columns = columns;
        this.components = components;
        this.getRowData = getRowData;
        this.getRowProps = getRowProps;
    }
}

/* ---------------------------------------------------- */

const renderStretchBlock = ({ scrollSize: height }) => <div className={topSpacerClass} style={{ height }} />

const Table = ({
    model,
    columns,
    getRowData,
    getRowProps,
    components,
    headless,
    footer,
    className,
    tabIndex = -1,
    ...props
}) => {

    const C = useMemo(
        () => Object.assign({}, DEFAULT_COMPONENTS_MAP, components ),
        [ components ]
    );

    const normalizedColumns = useMemo(() => columns.map( col => new TableColumn( col ) ), [ columns ]);

    const renderRows = useMemo(() => {
        
        const rowProps = new RowPropsClass( normalizedColumns, C, getRowData, getRowProps );

        return model => (
            <>
                <tr
                    className={hiddenClass}
                    ref={model.setZeroChildNode}
                    style={{ height: model.getOffset( model.from ) }} 
                />
                {mapVisibleRange( model, C.Row, rowProps )}
            </>
        );
    }, [ C, normalizedColumns, getRowData, getRowProps ]);

    return (
        <div className={cx(baseClass,className)} ref={model.setOuterNode} tabIndex={tabIndex} {...props}>
            <Subscription model={model} events={SCROLLSIZE_EVENTS}>
                {renderStretchBlock}
            </Subscription>
            <C.Table className={tableClass}>
                <Colgroup columns={normalizedColumns} />
                {headless ? null : (
                    <C.Thead className={theadClass}>
                        <C.Tr>
                            <C.HeaderCells columns={normalizedColumns} components={C} />
                        </C.Tr>
                    </C.Thead>
                )}
                <C.Tbody>
                    <Subscription model={model} events={RANGE_EVENTS}>
                        {renderRows}
                    </Subscription>
                </C.Tbody>
                {footer ? (
                    <C.Tfoot className={tfootClass}>
                        <C.Tr>
                            <C.FooterCells columns={normalizedColumns} components={C} />
                        </C.Tr>
                    </C.Tfoot>
                ) : null}
            </C.Table>
        </div>
    );
}

Table.propTypes = {
    className: PropTypes.string,
    columns: PropTypes.array.isRequired,
    getRowData: PropTypes.func.isRequired,
    getRowProps: PropTypes.func,
    headless: PropTypes.bool,
    footer: PropTypes.bool
};

export default memo( Table );