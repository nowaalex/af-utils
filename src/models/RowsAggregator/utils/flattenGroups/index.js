const flattenGroups = ( groupsMap, prefix = "", groupValues = [], rowIndexes = [] ) => {
    for( let [ groupValue, subGroup ] of groupsMap ){
        rowIndexes.push( -groupValues.push( prefix + groupValue ) );
        if( Array.isArray( subGroup ) ){
            rowIndexes.push.apply( rowIndexes, subGroup );
        }
        else{
            flattenGroups( subGroup, prefix + groupValue + ".", groupValues, rowIndexes );
        }
    }

    return { groupValues, rowIndexes };
}

export default flattenGroups;