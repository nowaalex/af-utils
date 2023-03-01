import { useMemo, memo } from "react";
import PropTypes from "prop-types";
import {
    Subscription,
    mapVisibleRange,
    EVT_SCROLL_SIZE,
    EVT_RANGE
} from "@af-utils/react-virtual-headless";
import { css, cx } from "@af-utils/styled";
import TableColumn from "models/TableColumn";
import TableRowProps from "models/TableRowProps";
import Colgroup from "./Colgroup";
import DEFAULT_COMPONENTS_MAP from "./components";

/*
    Todo:
        * think about border-collapse offsetHeight issue ( maybe throw border-collapse )
*/

const SCROLLSIZE_EVENTS = [EVT_SCROLL_SIZE];
const RANGE_EVENTS = [EVT_RANGE];

const baseClass = css("overflow: auto", "position: relative");

const top0Class = css("top: 0");
const hiddenClass = css("visibility: hidden");
const stickyClass = css("position: sticky");

const topSpacerClass = cx(
    hiddenClass,
    top0Class,
    css("position: absolute", "left: 0", "width: 1px")
);

const tableClass = css("table-layout: fixed", "min-width: 100%");

const theadClass = cx(stickyClass, top0Class);

const tfootClass = cx(stickyClass, css("bottom: 0"));

const Table = ({
    model,
    columns,
    getKey = i => i,
    getRowData,
    getRowProps,
    components,
    headless,
    footer,
    className,
    ColumnModel = TableColumn,
    tabIndex = -1,
    ...props
}) => {
    const C = useMemo(
        () => ({ ...DEFAULT_COMPONENTS_MAP, ...components }),
        [components]
    );

    const normalizedColumns = useMemo(
        () => columns.map(col => new ColumnModel(col, C)),
        [columns, C]
    );

    const renderRows = useMemo(() => {
        const rowProps = new TableRowProps(
            normalizedColumns,
            C,
            getRowData,
            getRowProps
        );

        return () => (
            <>
                <tr
                    className={hiddenClass}
                    style={{ height: model.getOffset(model.from) }}
                />
                {mapVisibleRange(model, i => (
                    <C.Row
                        key={getKey(i, rowProps)}
                        i={i}
                        i2={i}
                        data={rowProps}
                        model={model}
                    />
                ))}
            </>
        );
    }, [C, normalizedColumns, getRowData, getRowProps, getKey]);

    return (
        <div
            className={cx(baseClass, className)}
            ref={model.setScroller}
            tabIndex={tabIndex}
            {...props}
        >
            <Subscription model={model} events={SCROLLSIZE_EVENTS}>
                {() => (
                    <div
                        className={topSpacerClass}
                        style={{ height: model.scrollSize }}
                    />
                )}
            </Subscription>
            <C.Table className={tableClass}>
                <Colgroup columns={normalizedColumns} />
                {headless ? null : (
                    <C.Thead
                        className={theadClass}
                        ref={el => model.setStickyHeader(el)}
                    >
                        <C.Tr>
                            <C.HeaderCells
                                columns={normalizedColumns}
                                components={C}
                            />
                        </C.Tr>
                    </C.Thead>
                )}
                <C.Tbody>
                    <Subscription model={model} events={RANGE_EVENTS}>
                        {renderRows}
                    </Subscription>
                </C.Tbody>
                {footer ? (
                    <C.Tfoot
                        className={tfootClass}
                        ref={el => model.setStickyFooter(el)}
                    >
                        <C.Tr>
                            <C.FooterCells
                                columns={normalizedColumns}
                                components={C}
                            />
                        </C.Tr>
                    </C.Tfoot>
                ) : null}
            </C.Table>
        </div>
    );
};

Table.propTypes = {
    model: PropTypes.object.isRequired,
    components: PropTypes.object,
    tabIndex: PropTypes.number,
    className: PropTypes.string,
    columns: PropTypes.array.isRequired,
    getRowData: PropTypes.func.isRequired,
    getRowProps: PropTypes.func,
    getKey: PropTypes.func,
    headless: PropTypes.bool,
    footer: PropTypes.bool,
    ColumnModel: PropTypes.func
};

export default memo(Table);
