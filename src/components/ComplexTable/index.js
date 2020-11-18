import { Fragment, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import RowsAggregator from "models/tables/RowsAggregator";
import Table from "../Table";

const ComplexTable = ({ rowsQuantity, getRowData, ...props }) => {

    const propsToMerge = {
        rowsQuantity,
        getRowData
    };

    const [ m ] = useState(() => new RowsAggregator( propsToMerge ) );

    const { sortedIndexes } = m;

    const renderRow = ( rowIndex, columns, getRowData, renderCell, CellsList, Cell ) => (
        <tr key={rowIndex}>
            <CellsList
                rowIndex={sortedIndexes[rowIndex]}
                columns={columns}
                getRowData={getRowData}
                renderCell={renderCell}
                Cell={Cell}
            />
        </tr>
    );

    const renderTheadContents = columns => (
        <tr>
            {columns.map(({ dataKey, label }) => (
                <th key={dataKey} onClick={ e => e.ctrlKey ? m.addGrouping( dataKey ) : m.setSorting( dataKey )}>
                    {label}
                    <div>
                        <input onChange={e => m.setFiltering( dataKey, e.target.value )} />
                    </div>
                </th>
            ))}
        </tr>        
    );

    useEffect(() => m.merge( propsToMerge ));

    console.log( "SS", m.sortDataKey)

    return (
        <Table
            rowsQuantity={m.sortedIndexes.length}
            getRowData={getRowData}
            renderRow={renderRow}
            renderTheadContents={renderTheadContents}
            {...props}
        />
    );
}

export default observer( ComplexTable );