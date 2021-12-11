const getFilteredIndexes = ( itemCount, getRowData, filtersMap ) => {
    if( filtersMap.size ){

        const result = [];

        mainLoop:
        for( let j = 0, row; j < itemCount; j++ ){
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

    return Array.from({ length: itemCount }, ( v, i ) => i );
}

export default getFilteredIndexes;