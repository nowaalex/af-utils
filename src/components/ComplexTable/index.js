import { Fragment, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import RowsAggregator from "models/RowsAggregator";
import Table from "../Table";
import cx from "utils/cx";
import css from "./style.module.scss";
import { useDrag, useDrop } from "react-dnd";

const HEADER_DND_TYPE = "h";

const HeaderLabel = /*#__PURE__*/ observer(({ m, dataKey, label, i }) => {

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
            {i === 0 ? <span data-collapsed={m.compact?"":undefined} onClick={() => m.toggleCompact()} className={css.compactToggler} /> : null}
            {label}
        </div>
    );
});

const HeaderInput = /*#__PURE__*/ observer(({ m, dataKey }) => m.compact ? null : (
    <input
        className={css.input}
        value={m.filtersMap.get( dataKey )||""}
        onChange={e => m.setFiltering( dataKey, e.target.value )}
    />
));

const getCount = rowIndexes => {

    let total = 0;

    if( Array.isArray( rowIndexes ) ){
        total += rowIndexes.length;
    }
    else {
        for( let nested of rowIndexes.values() ){
            if( nested ){
                total += getCount( nested );
            }
        }
    }

    return total;
}

const getSum = ( rowIndexes, dataKey, getRowData ) => {

    let total = 0;

    if( Array.isArray( rowIndexes ) ){
        let row;
        for( let j of rowIndexes ){
            row = getRowData( j );
            if( row ){
                total += row[ dataKey ];
            }
        }
    }
    else {
        for( let nested of rowIndexes.values() ){
            if( nested ){
                total += getSum( nested, dataKey, getRowData );
            }
        }
    }

    return total;
}

const SummaryCell = /*#__PURE__*/ observer(({ m, column, rowIndexes }) => {

    if( column.totals === "count" ){
        return getCount( rowIndexes );
    }

    if( column.totals === "sum" ){
        const sum = getSum( rowIndexes, column.dataKey, m.getRowData );
        const fn = column.formatTotal || column.format;
        return fn ? fn( sum ) : sum;
    }

    return null;
});

const GroupLabelDefault = ({ groupKey, columns, onRemove }) => (
    <div className={css.groupLabel} onDoubleClick={onRemove}>
        {columns.find( col => col.dataKey === groupKey ).label}
    </div>
);

const GroupsPanel = /*#__PURE__*/ observer(({ m, GroupLabel }) => {

    const [ collectedProps, dropRef ] = useDrop({
        accept: HEADER_DND_TYPE,
        drop( item ){
            m.addGrouping( item.dataKey );
        }
    });

    return m.compact ? null : (
        <div className={css.groupsPanel} ref={dropRef}>
            {m.groupKeys.length ? m.groupKeys.map( groupKey => (
                <GroupLabel
                    key={groupKey}
                    groupKey={groupKey}
                    columns={m.columns}
                    onRemove={() => m.removeGrouping( groupKey )}
                />
            )) : "Drag column headers here to group by column" }
        </div>
    );
});

const getInMap = ( map, path ) => path.reduce(( res, key ) => res.get( key ), map );

const GroupCell = /*#__PURE__*/ observer(({ m, columns, idx }) => {

    const isCollapsed = m.collapsedGroups.has( idx );

    if( m.hasGrouping ){

        const groupPath = m.flattenedGroups.groupValues[~idx];

        if( groupPath ){

            const lastGroupIndex = groupPath.length - 1;
            const groupKey = m.groupKeys[lastGroupIndex];
            /* hidden columns also must be included */
            const { getGroupLabel, label, format } = m.columns.find( c => c.dataKey === groupKey );
            const groupValue = groupPath[lastGroupIndex];

            return (
                <Fragment>
                    <span
                        className={css.groupToggler}
                        onClick={() => m.toggleCollapsedGroup( idx )}
                        data-collapsed={isCollapsed?"":undefined}
                        style={{
                            marginLeft: `${(lastGroupIndex)*2}em`
                        }}
                    />
                    &nbsp;
                    {getGroupLabel?getGroupLabel(groupValue):(
                        <Fragment>
                            {label}:&nbsp;{format?format(groupValue):""+groupValue}
                        </Fragment>
                    )}
                    {columns.length ? (
                        <span className={css.columnSummaries}>
                            {columns.map( col => col.totals ? (
                                <span key={col.dataKey}>
                                    {col.label}:
                                    &nbsp;
                                    <SummaryCell
                                        m={m}
                                        column={col}
                                        rowIndexes={getInMap(m.grouped,groupPath)}
                                    />
                                </span>
                            ) : null)}
                        </span>
                    ) : null}
                </Fragment>
            );
        }
        
    }

    return null;
});

const ComplexTable = ({ rowsQuantity, getRowData, className, columns, GroupLabel = GroupLabelDefault, ...props }) => {

    const [ m ] = useState(() => new RowsAggregator());

    /* hack to change renderRow by link */
    const { finalIndexes } = m;

    const renderRow = RowProps => {

        const realRowIndex = finalIndexes[ RowProps.index ];

        return realRowIndex < 0 ? (
            <tr key={RowProps.index}>
                <td colSpan={RowProps.columns.length}>
                    <GroupCell m={m} idx={realRowIndex} columns={RowProps.columns} />
                </td>
            </tr>
        ) : (
            <RowProps.Row
                {...RowProps}
                key={RowProps.index}
                index={realRowIndex}
            />
        );
    }

    const renderHeaderCells = columns => columns.map(({ dataKey, label, minWidth }, i ) => (
        <th key={dataKey} style={{ minWidth }}>
            <HeaderLabel m={m} dataKey={dataKey} label={label} i={i} />
            <HeaderInput m={m} dataKey={dataKey} />
        </th>
    ));

    useEffect(() => m.merge({ rowsQuantity, getRowData, columns }), [ rowsQuantity, getRowData, columns ]);

    useEffect(() => {
        const initialGroupingKeys = m.visibleColumns
            .slice()
            .sort(( a, b ) => ( a.initialGrouingIndex || 0 ) - ( b.initialGrouingIndex || 0 ) )
            .filter( col => col.initialGroupingIndex )
            .map( col => col.dataKey );

        m.setGrouping( initialGroupingKeys );
    }, []);

    const renderTfootContent = normalizedVisibleColumns => normalizedVisibleColumns.some( col => !!col.totals ) ? (
        <tr>
            {normalizedVisibleColumns.map( col => (
                <td key={col.dataKey}>
                    <SummaryCell m={m} column={col} rowIndexes={m.filteredIndexes} />
                </td>
            ))}
        </tr>
    ) : null;

    /*
        Normally must be wrapped with DndProvider, but nested providers throw error.
        Waiting for react-dnd release, which would fix this
    */
    return (
        <div className={cx(css.wrapper,className)}>
            <GroupsPanel m={m} GroupLabel={GroupLabel} />
            <Table
                columns={m.visibleColumns}
                rowsQuantity={finalIndexes.length}
                getRowData={getRowData}
                renderRow={renderRow}
                renderHeaderCells={renderHeaderCells}
                renderTfootContent={renderTfootContent}
                {...props}
            />
        </div>
    );
}

export default /*#__PURE__*/ observer( ComplexTable );