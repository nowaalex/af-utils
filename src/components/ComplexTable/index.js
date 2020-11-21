import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import RowsAggregator from "models/RowsAggregator";
import Table from "../Table";
import cx from "utils/cx";
import css from "./style.module.scss";

const HeaderLabel = observer(({ m, dataKey, label }) => (
    <div
        className={css.sortableHeader}
        onClick={ e => e.ctrlKey ? m.addGrouping( dataKey ) : m.setSorting( dataKey )}
        aria-sort={m.sortDataKey === dataKey?(m.sortDirection===1?"ascending":"descending"):undefined}
    >
        {label}
    </div>
));

const HeaderInput = observer(({ m, dataKey }) => (
    <input
        className={css.input}
        value={m.filtersMap.get( dataKey )||""}
        onChange={e => m.setFiltering( dataKey, e.target.value )}
    />
));

const ComplexTable = ({ rowsQuantity, getRowData, className, ...props }) => {

    const [ m ] = useState(() => new RowsAggregator());

    const { finalIndexes } = m;

    const renderRow = ( rowIndex, columns, getRowData, renderCell, CellsList, Cell ) => {
        const realRowIndex = finalIndexes[ rowIndex ];
        return (
            <tr key={realRowIndex}>
                {realRowIndex < 0 ? (
                    <td colSpan={columns.length}>{realRowIndex}&nbsp;{m.flattenedGroups.groupValues[~realRowIndex]}</td>
                ) : (
                    <CellsList
                        rowIndex={realRowIndex}
                        columns={columns}
                        getRowData={getRowData}
                        renderCell={renderCell}
                        Cell={Cell}
                    />
                )}
            </tr>
        );
    }

    const renderTheadContents = columns => (
        <tr>
            {columns.map(({ dataKey, label }) => (
                <th key={dataKey}>
                    <HeaderLabel m={m} dataKey={dataKey} label={label} />
                    <HeaderInput m={m} dataKey={dataKey} />
                </th>
            ))}
        </tr>        
    );

    useEffect(() => m.merge({ rowsQuantity, getRowData }));

    return (
        <Table
            rowsQuantity={finalIndexes.length}
            getRowData={getRowData}
            renderRow={renderRow}
            renderTheadContents={renderTheadContents}
            className={cx(css.wrapper,className)}
            {...props}
        />
    );
}

export default observer( ComplexTable );