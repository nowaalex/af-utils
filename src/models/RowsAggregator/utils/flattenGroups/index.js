const flattenGroups = ( groupsMap, collapsedGroups, prefix = [], groupValues = [], rowIndexes = [] ) => {
    let idx;
    for( let [ groupValue, subGroup ] of groupsMap ){
        const concatenated = prefix.concat( groupValue );
        idx = -groupValues.push( concatenated );
        rowIndexes.push( idx );
        if( !collapsedGroups.has( idx ) ){
            if( Array.isArray( subGroup ) ){
                rowIndexes.push.apply( rowIndexes, subGroup );
            }
            else{
                flattenGroups( subGroup, collapsedGroups, concatenated, groupValues, rowIndexes );
            }
        }
    }

    return { groupValues, rowIndexes };
}

export default flattenGroups;