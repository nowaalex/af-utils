import { PureComponent } from "react";
import { observer } from "mobx-react-lite";
import RowsAggregator from "models/aggregators/Mobx";
import { Table, cx, useVirtual } from "af-virtual-scroll";
import { useDrag, useDrop } from "react-dnd";
import css from "./style.module.scss";

const HEADER_DND_TYPE = "h";

const HeaderLabel = /*#__PURE__*/ observer(({ m, dataKey, label, i }) => {

    const [ , dragRef ] = useDrag(() => ({
        type: HEADER_DND_TYPE,
        item: {
            dataKey
        }}
    ), [ dataKey ]);

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
        for( const j of rowIndexes ){
            row = getRowData( j );
            if( row ){
                total += row[ dataKey ];
            }
        }
    }
    else {
        for( const nested of rowIndexes.values() ){
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
        if( column.formatTotal ){
            const secondArg = m.getTotalsFormattingHelper ? m.getTotalsFormattingHelper() : null;
            return column.formatTotal( sum, secondArg );
        }
        if( column.format ){
            return column.format( sum );
        }
        return sum;
    }

    return null;
});

const GroupLabelDefault = ({ groupKey, columns, onRemove }) => (
    <div className={css.groupLabel} onDoubleClick={onRemove}>
        {columns.find( col => col.dataKey === groupKey ).label}
    </div>
);

const GroupsPanel = /*#__PURE__*/ observer(({ m, GroupLabel }) => {

    const [ collectedProps, dropRef ] = useDrop(() => ({
        accept: HEADER_DND_TYPE,
        drop( item ){
            m.addGrouping( item.dataKey );
        }
    }), [ m ]);

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
                <>
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
                        <>
                            {label}:&nbsp;{format?format(groupValue):""+groupValue}
                        </>
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
                </>
            );
        }
        
    }

    return null;
});

const TableWrapper = observer(({ m, fixed, estimatedItemSize, overscanCount, ...props }) => {

    const model = useVirtual({
        itemCount: m.finalIndexes.length,
        fixed,
        estimatedItemSize,
        overscanCount
    });

    const renderRow = ( index, RowProps ) => {

        const realRowIndex = m.finalIndexes[ index ];

        return realRowIndex < 0 ? (
            <tr key={index}>
                <td colSpan={RowProps.columns.length}>
                    <GroupCell m={m} idx={realRowIndex} columns={RowProps.columns} />
                </td>
            </tr>
        ) : (
            <RowProps.Row
                {...RowProps}
                key={index}
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

    const renderTfootContent = normalizedVisibleColumns => normalizedVisibleColumns.some( col => !!col.totals ) ? (
        <tr>
            {normalizedVisibleColumns.map( col => (
                <td key={col.dataKey}>
                    <SummaryCell m={m} column={col} rowIndexes={m.filteredIndexes} />
                </td>
            ))}
        </tr>
    ) : null;

    return (
        <Table
            model={model}
            columns={m.visibleColumns}
            renderRow={renderRow}
            renderHeaderCells={renderHeaderCells}
            renderTfootContent={renderTfootContent}
            {...props}
        />
    );
});

class ComplexTable extends PureComponent {

    constructor( props ){
        super( props );

        const m = new RowsAggregator();

        this.state = { m };

        const initialGroupingKeys = m.visibleColumns
            .filter( col => col.initialGrouingIndex > 0 )
            .sort(( a, b ) => a.initialGrouingIndex - b.initialGrouingIndex )
            .map( col => col.dataKey );

        m.setGrouping( initialGroupingKeys );
    }

    static getDerivedStateFromProps({ itemCount, getRowData, getTotalsFormattingHelper, columns }, { m }){
        m.merge({ itemCount, getRowData, getTotalsFormattingHelper, columns });
        return null;
    }

    render(){

        const {
            itemCount,
            getTotalsFormattingHelper,
            className,
            columns,
            GroupLabel = GroupLabelDefault,
            ...props
        } = this.props;

        const { m } = this.state;

        return (
            <div className={cx(css.wrapper,className)}>
                <GroupsPanel m={m} GroupLabel={GroupLabel} />
                <TableWrapper m={m} {...props} />
            </div>
        );
    }
}

export default ComplexTable;