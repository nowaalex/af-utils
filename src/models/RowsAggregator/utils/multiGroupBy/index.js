const multiGroupBy = ( indexesArray, groupDataKeysList, getRowData ) => {

    const lastGroupIndex = groupDataKeysList.length - 1;

    if( process.env.NODE_ENV !== "production" ){
        if( lastGroupIndex < 0 ){
            throw new Error( "lastGroupIndex < 0" );
        }
    }

    const lastGroupDataKey = groupDataKeysList[ lastGroupIndex ];
    const groupsMap = new Map();
   

    for( let rowIndex of indexesArray ){
        /*
            It is better to start from indexes iteration, not from groups, to minimize getRowData calls
        */
        const row = getRowData( rowIndex );

        let innerObject = groupsMap,
            tmpInnerObject,
            cellValue;

        /*
            We could put everything in one loop, but last iteration is different.
        */
        for( let i = 0; i < lastGroupIndex; i++ ){
            cellValue = row[ groupDataKeysList[ i ] ];
            tmpInnerObject = innerObject.get( cellValue );
            if( !tmpInnerObject ){
                tmpInnerObject = new Map();
                innerObject.set( cellValue, tmpInnerObject );
            }
            innerObject = tmpInnerObject;
        }

        cellValue = row[ lastGroupDataKey ];
        tmpInnerObject = innerObject.get( cellValue );

        if( tmpInnerObject ){
            tmpInnerObject.push( rowIndex );
        }
        else {
            innerObject.set( cellValue, [ rowIndex ]);
        }
    }

    return groupsMap;
}

export default multiGroupBy;