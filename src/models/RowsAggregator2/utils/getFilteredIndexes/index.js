const getFilteredIndexes = ( rowsQuantity, getRowData, filtersMap ) => {
    if( filtersMap.size ){

        const result = [];

        mainLoop:
        for( let j = 0, row; j < rowsQuantity; j++ ){
            row = getRowData( j );

            if( row ){
                for( const [ dataKey, value ] of filtersMap ){
                    if( !( "" + row[ dataKey ] ).toLowerCase().includes( value ) ){
                        continue mainLoop;
                    }
                }

                result.push( j );
            }            
        }

        return result;
    }

    return Array.from({ length: rowsQuantity }, ( v, i ) => i );
}

export default getFilteredIndexes;