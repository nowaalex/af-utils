import { useState, useEffect } from "react";
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
        <DndProvider backend={HTML5Backend}>
            <div className={cx(css.wrapper,className)}>
                <GroupsPanel m={m} />
                <Table
                    rowsQuantity={finalIndexes.length}
                    getRowData={getRowData}
                    renderRow={renderRow}
                    renderTheadContents={renderTheadContents}
                    {...props}
                />
            </div>
        </DndProvider> 
    );
}

export default observer( ComplexTable );