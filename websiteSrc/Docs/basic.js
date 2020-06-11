import React, { Fragment } from "react";
import { css } from "@emotion/core";
import Code from "../Code";

const codeCss = css`
    font-size: 0.8em;
    display: inline-flex;
`;

const importCode = `/* import style once in your project */
import "af-virtual-scroll/lib/style.css";

/* import component( both named and default import syntax supported ) */
import { Table, List } from "af-virtual-scroll";

/* OR */
import Table from "af-virtual-scroll/lib/Table";
import List from "af-virtual-scroll/lib/List";
/* end import */

/*Polyfill ResizeObserver and MutationObserver if needed.*/
const examplePolyfill = "https://github.com/juggle/resize-observer";`;

const totalsCode = `{
    column1: [ "sum", "max" ],
    column2: [ "average" ]
}`;

const columnsCode = `{
    // unique key for column
    dataKey: string.isRequired,

    // for details see CellComponent implementation
    getCellData: func,
    getEmptyCellData: func,
    format: func,
    render: func,
    formatTotal: func,

    visibility: oneOf([ "visible", "hidden" ]),
    sort: oneOf([ "locale", "numeric" ]),

    // column props, affecting colgroup > col tags
    background: string,
    border: string,
    width: oneOfType([ number, string ]),

    // These two override global props, if present
    CellComponent: any,
    getCellExtraProps: func
}`;

const Basic = () => (
    <Fragment>
        <h3>Usage</h3>
        <Code css={codeCss}>{importCode}</Code>
        <h3>Common props (Table/List)</h3>
        <ul>
            <li>
                <h4 data-required>rowCount</h4>
                <p>
                    Indicates number of rows for table/list.
                </p>
            </li>
            <li>
                <h4 data-required>getRowData(rowIndex)</h4>
                <p>
                    Returns row data object. If a reference to this method changes - table/list reloads data, so it should be wrapped with useCallback.
                </p>
            </li>
            <li>
                <h4>getRowKey(rowIndex)</h4>
                <p>
                    By default rowIndex is used as row key. If you want to optimize this - go ahead.
                </p>
            </li>
            <li>
                <h4>getRowExtraProps(rowData,rowIndex,rowDataIndex)</h4>
                <p>
                    Returns an object of extra props, that will be passed to row wrapper(usually tr for table and div for list).
                    Hooks also can be called here.
                    rowIndex afer sorting remains 1, 2, 3, etc.
                    rowDataIndex refers initial data indexes ( can be 1, 10, 5, 3, etc. )
                </p>
            </li>
            <li>
                <h4>className</h4>
                <p>
                    Widget wrapper additional css class.
                </p>
            </li>
            <li>
                <h4>fixedSize</h4>
                <p>
                    By default table/list assumes, that it's rows have different heights.
                    If you are SURE, that all rows always will have same height(after collapsing widget width, etc.) - put this prop as true.
                    This will optimize calculations. For details see difference between FixedSizeList and VariableSizeList&nbsp;
                    <a href="https://github.com/nowaalex/af-virtual-scroll/tree/master/src/models" target="_blank">here.</a>
                </p>
            </li>
            <li>
                <h4>overscanRowsCount</h4>
                <p>
                    Determines, how many rows are drawn above and below table/list visible part.
                </p>
            </li>
            <li>
                <h4>estimatedRowHeight</h4>
                <p>
                    Quantity of rows to render is roughly counted like this: availableHeight / rowHeight.
                    So quantity of initially rendered rows can be tweaked. Further, when exact height/heights of rows would be known,
                    this value would not be used.
                </p>
            </li>
        </ul>
        <h3>List props</h3>
        <ul>
            <li>RowComponent</li>
            <p>
                <a href="https://github.com/nowaalex/af-virtual-scroll/blob/master/src/List/common/Row.js" target="_blank">
                    Default implementation
                </a>
            </p>
        </ul>
        <h3>Table props</h3>
        <ul>
            <li>
                <h4 data-required>columns</h4>
                <p>
                    Array of objects of shape:
                </p>
                <Code css={codeCss}>{columnsCode}</Code>
            </li>
            <li>
                <h4>headless</h4>
                <p>
                    Omits thead rendering if enabled.
                </p>
            </li>
            <li>
                <h4>totals</h4>
                <p>
                    Object, where keys are column dataKeys, and values are arrays of ( "sum", "average", "count", "max", "min" ).
                </p>
                <Code css={codeCss}>{totalsCode}</Code>
            </li>
            <li>
                <h4>nonSticky</h4>
                <p>
                    Scrollable table body can be achieved either by position: sticky table cells or by rendering 3 separate tables.
                    This prop allows to render table in non-sticky mode, even when browser supports position: sticky. <br />
                    <a href="https://github.com/nowaalex/af-virtual-scroll/blob/master/src/utils/isPositionStickySupported/index.js" target="_blank">
                        Util implementation
                    </a>
                </p>
            </li>
            <li>
                <h4>RowComponent</h4>
                <p>
                    <a href="https://github.com/nowaalex/af-virtual-scroll/blob/master/src/Table/common/Row.js" target="_blank">
                        Default implementation
                    </a>
                </p>
            </li>
            <li>
                <h4>CellComponent</h4>
                <p>
                    <a href="https://github.com/nowaalex/af-virtual-scroll/blob/master/src/Table/common/Cell.js" target="_blank">
                        Default implementation
                    </a>
                </p>
            </li>
            <li>
                <h4>TotalsCellComponent</h4>
                <p>
                    <a href="https://github.com/nowaalex/af-virtual-scroll/blob/master/src/Table/common/TotalsCell.js" target="_blank">
                        Default implementation
                    </a>
                </p>
            </li>
            <li>
                <h4>getCellProps(rowData,columnIndex)</h4>
                <p>
                    Returns an object of extra props, that will be passed to td.
                    Hooks also can be called here.
                </p>
            </li>
        </ul>
    </Fragment>
);

export default Basic;