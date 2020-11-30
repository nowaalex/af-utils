import { Fragment, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import RowsAggregator from "models/RowsAggregator";
import Table from "../Table";
import cx from "utils/cx";
import css from "./style.module.scss";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag, useDrop, DndProvider } from "react-dnd";

const HEADER_DND_TYPE = "h";

const HeaderLabel = observer(({ m, dataKey, label }) => {

    const [ collectedProps, dragRef ] = useDrag({ item: {
        type: HEADER_DND_TYPE,
        dataKey
    }});

    return (
        <div
            ref={dragRef}
            className={css.sortableHeader}
            onClick={() => m.setSorting( dataKey )}
            aria-sort={m.sortDataKey === dataKey?(m.sortDirection===1?"ascending":"descending"):undefined}
        >
            {label}
        </div>
    );
});

const HeaderInput = observer(({ m, dataKey }) => (
    <input
        className={css.input}
        value={m.filtersMap.get( dataKey )||""}
        onChange={e => m.setFiltering( dataKey, e.target.value )}
    />
));

const SummaryCell = observer(({ m, type, dataKey }) => {

    const { filteredIndexes, getRowData } = m;

    if( type === "count" ){
        return filteredIndexes.length;
    }

    if( type === "sum" ){
        let res = 0;

        for( let j of filteredIndexes ){
            row = getRowData( j );
            res += row[ dataKey ];
        }

        return res;
    }

    return null;
});

const GroupsPanel = observer(({ m }) => {

    const [ collectedProps, dropRef ] = useDrop({
        accept: HEADER_DND_TYPE,
        drop( item ){
            m.addGrouping( item.dataKey );
        }
    });

    return (
        <div className={css.groupsPanel} ref={dropRef}>
            {m.groupKeys.length ? m.groupKeys.map( groupKey => (
                <div className={css.groupLabel} key={groupKey} onDoubleClick={() => m.removeGrouping( groupKey )}>
                    {groupKey}
                </div>
            )) : "Drag column headers here to group by column" }
        </div>
    );
});

const GroupCell = observer(({ m, idx }) => {

    const isCollapsed = m.collapsedGroups.has( idx );

    return m.hasGrouping ? (
        <Fragment>
            <span onClick={() => m.toggleCollapsedGroup( idx )}>{isCollapsed ? "+" : "-"}</span>
            &nbsp;{m.flattenedGroups.groupValues[~idx]}
        </Fragment>
    ) : null;
});

const ComplexTable = ({ rowsQuantity, getRowData, className, ...props }) => {

    const [ m ] = useState(() => new RowsAggregator());

    const { finalIndexes } = m;

    const renderRow = ( rowIndex, columns, getRowData, renderCell, CellsList, Cell ) => {
        const realRowIndex = finalIndexes[ rowIndex ];
        return (
            <tr key={realRowIndex}>
                {realRowIndex < 0 ? (
                    <td colSpan={columns.length}>
                        <GroupCell m={m} idx={realRowIndex} />
                    </td>
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

    const renderHeaderCells = columns => columns.map(({ dataKey, label }) => (
        <th key={dataKey}>
            <HeaderLabel m={m} dataKey={dataKey} label={label} />
            <HeaderInput m={m} dataKey={dataKey} />
        </th>
    ));  

    useEffect(() => m.merge({ rowsQuantity, getRowData }));

    const renderFooter = normalizedVisibleColumns => normalizedVisibleColumns.some( col => !!col.totals ) ? (
        <tfoot>
            <tr>
                {normalizedVisibleColumns.map(({ dataKey, totals }) => (
                    <td key={dataKey}>
                        <SummaryCell m={m} dataKey={dataKey} type={totals} />
                    </td>
                ))}
            </tr>
        </tfoot>
    ) : null;

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={cx(css.wrapper,className)}>
                <GroupsPanel m={m} />
                <Table
                    rowsQuantity={finalIndexes.length}
                    getRowData={getRowData}
                    renderRow={renderRow}
                    renderHeaderCells={renderHeaderCells}
                    renderFooter={renderFooter}
                    {...props}
                />
            </div>
        </DndProvider> 
    );
}

export default observer( ComplexTable );