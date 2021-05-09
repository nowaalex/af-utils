const getSorter = ( getRowData, sortDataKey, sortDirection ) => ( a, b ) => {
    const row1 = getRowData( a );
    const row2 = getRowData( b );

    if( row1 && row2 ){
        const v1 = row1[ sortDataKey ];
        const v2 = row2[ sortDataKey ];
        return v1 > v2 ? sortDirection : v1 < v2 ? -sortDirection : 0;
    }

    return row1 ? sortDirection : row2 ? -sortDirection : 0;
}

export default getSorter;