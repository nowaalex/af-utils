import { makeAutoObservable, computed } from "mobx"; 

const groupBy = ( seq, getRowData, dataKey ) => seq.reduce(( map, v ) => {
    const key = getRowData( v )[ dataKey ];
    let arr = map.get( key );
    if( arr ){
        arr.push( v );
    }
    else {
        map.set( key, [ v ]);
    }
    return map;
}, new Map() );

const changeValues = ( map, cb, restGroupingKeys, getRowData ) => {
    for( let [ k, v ] of map ){
        map.set( k, cb( v, restGroupingKeys, getRowData ) );
    }
    return map;
}

const multiGroupBy = ( seq, keys, getRowData ) => keys.length ? changeValues(
    groupBy( seq, getRowData, keys[ 0 ] ),
    multiGroupBy,
    keys.slice( 1 ),
    getRowData
) : seq;


class RowsAggregator {

    /* Provided from renderer */
    rowsQuantity = 0;
    getRowData = null;

    /* Calculated inside model */
    filtersMap = new Map();
    groupKeys = [];
    sortDataKey = "";
    sortDirection = -1;

    shallowGroupsStore = new Map();

    setFiltering( dataKey, value ){
        if( value ){
            this.filtersMap.set( dataKey, value.toLowerCase() );
        }
        else{
            this.filtersMap.delete( dataKey );
        }
    }

    setSorting( dataKey ){
        if( this.sortDataKey === dataKey ){
            this.sortDirection *= -1;
        }
        this.sortDataKey = dataKey;
    }

    addGrouping( dataKey ){
        if( !this.groupKeys.includes( dataKey ) ){
            this.groupKeys.push( dataKey );
        }
        console.log( "ff", this.grouped )
    }

    removeGrouping( dataKey ){
        this.groupKeys.splice( this.groupKeys.indexOf( dataKey ) >>> 0, 1 );
    }

    get orderedIndexes(){
        return Array.from({ length: this.rowsQuantity }, ( v, i ) => i );
    }

    get grouped(){
        return multiGroupBy( this.filteredIndexes, this.groupKeys, this.getRowData );
    }

    get filteredIndexes(){
        const { filtersMap, orderedIndexes } = this;
        if( this.filtersMap.size ){
            const filteredIndexesArray = orderedIndexes.filter( idx => {
                const row = this.getRowData( idx );
                for( let [ dataKey, value ] of filtersMap ){
                    if( !String( row[ dataKey ] ).toLowerCase().includes( value ) ){
                        return false;
                    }
                }
                return true;
            });

            return filteredIndexesArray;
        }
        return this.orderedIndexes;
    }

    get sortedIndexes(){
        const { sortDataKey, sortDirection } = this;

        return sortDataKey === "" ? this.filteredIndexes : this.filteredIndexes.sort(( a, b ) => {
            const row1 = this.getRowData( a );
            const row2 = this.getRowData( b );

            if( row1 && row2 ){
                const v1 = row1[ sortDataKey ];
                const v2 = row2[ sortDataKey ];
                return v1 > v2 ? sortDirection : v1 < v2 ? -sortDirection : 0;
            }

            return row1 ? sortDirection : row2 ? -sortDirection : 0;
        });
    }

    constructor(){
        makeAutoObservable( this, {
            shallowGroupsStore: false,
            sortedIndexes: computed({ equals: () => false }),
            filteredIndexes: computed({ equals: () => false }),
            orderedIndexes: computed({ equals: () => false }),
        });
    }

    merge( propertiesObj ){
        Object.assign( this, propertiesObj );
    }
}

export default RowsAggregator;