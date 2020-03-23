import React, { Fragment } from "react";

const Basic = () => (
    <Fragment>
        <h3>Common props</h3>
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
                <h4>getRowExtraProps(rowData,rowIndex)</h4>
                <p>
                    Returns an object of extra props, that will be passed to row wrapper(usually tr for table and div for list).
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
                    This will optimize calculations.
                </p>
            </li>
            <li>
                <h4>overscanRowsCount</h4>
                <p>
                    Determines, how many rows are drawn above and below table/list visible part.
                </p>
            </li>
        </ul>
    </Fragment>
);

export default Basic;