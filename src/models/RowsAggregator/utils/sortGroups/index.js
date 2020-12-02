import getSorter from "../getSorter";

const sortGroups = ( groupsMap, getRowData, sortDataKey, sortDirection, depth, currentDepth = 0 ) => {

    const groupValues = groupsMap.values();

    if( currentDepth < depth - 1 ){
        for( let group of groupValues ){
            if( group ){
                sortGroups( group, getRowData, sortDataKey, sortDirection, depth, currentDepth + 1 );
            }
        }
    }
    else{
        const sortCallback = getSorter( getRowData, sortDataKey, sortDirection );

        for( let group of groupValues ){
            if( group ){
                group.sort( sortCallback );
            }
        }
    }
}

export default sortGroups;