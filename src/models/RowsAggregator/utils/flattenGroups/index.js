const flattenGroups = ( groupsMap, collapsedGroups, prefix = "", groupValues = [], rowIndexes = [] ) => {
    let idx;
    for( let [ groupValue, subGroup ] of groupsMap ){
        idx = -groupValues.push( prefix + groupValue );
        rowIndexes.push( idx );
        if( !collapsedGroups.has( idx ) ){
            if( Array.isArray( subGroup ) ){
                rowIndexes.push.apply( rowIndexes, subGroup );
            }
            else{
                flattenGroups( subGroup, collapsedGroups, prefix + groupValue + ".", groupValues, rowIndexes );
            }
        }
    }

    return { groupValues, rowIndexes };
}

export default flattenGroups;