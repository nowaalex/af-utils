const multiGroupBy = ( groupsMap, indexesArray, groupDataKeysList, getRowData, priorityGroupValuesArray ) => {

    const lastGroupIndex = groupDataKeysList.length - 1;

    if( process.env.NODE_ENV !== "production" ){
        if( lastGroupIndex < 0 ){
            throw new Error( "lastGroupIndex < 0" );
        }
    }

    const lastGroupDataKey = groupDataKeysList[ lastGroupIndex ];
   

    for( let rowIndex of indexesArray ){
        /*
            It is better to start from indexes iteration, not from groups, to minimize getRowData calls
        */
        const row = getRowData( rowIndex );

        if( !row ){
            continue;
        }

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
                for( let priorityValue of priorityGroupValuesArray[ i ] ){
                    if( !innerObject.has( priorityValue ) ){
                        innerObject.set( priorityValue, null );
                    }
                }
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
            for( let priorityValue of priorityGroupValuesArray[ lastGroupIndex ] ){
                if( !innerObject.has( priorityValue  ) ){
                    innerObject.set( priorityValue, null );
                }
            }
            innerObject.set( cellValue, [ rowIndex ]);
        }
    }
}

export default multiGroupBy;