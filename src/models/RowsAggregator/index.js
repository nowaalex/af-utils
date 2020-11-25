import { makeAutoObservable, computed } from "mobx"; 
import multiGroupBy from "./utils/multiGroupBy";
import sortGroups from "./utils/sortGroups";
import flattenGroups from "./utils/flattenGroups";
import getSorter from "./utils/getSorter";

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

    get groupedSorted(){
        if( this.sortDataKey ){
            sortGroups( this.grouped, this.getRowData, this.sortDataKey, this.sortDirection, this.groupKeys.length );
        }
        return this.grouped;
    }

    get flattenedGroups(){
        return flattenGroups( this.groupedSorted );
    }

    get filteredIndexes(){
        //return this.orderedIndexes;
        const { filtersMap, orderedIndexes } = this;
        if( this.filtersMap.size ){
            const filteredIndexesArray = orderedIndexes.filter( idx => {
                const row = this.getRowData( idx );
                for( let [ dataKey, value ] of filtersMap ){
                    if( !( "" + row[ dataKey ] ).toLowerCase().includes( value ) ){
                        return false;
                    }
                }
                return true;
            });

            return filteredIndexesArray;
        }
        return orderedIndexes;
    }

    
    get noGroupsSortedIndexes(){
        return this.sortDataKey ? this.filteredIndexes.sort( getSorter( this.getRowData, this.sortDataKey, this.sortDirection ) ) : this.filteredIndexes;
    }

    get groupsSortedIndexes(){
        return this.flattenedGroups.rowIndexes;
    }

    get hasGrouping(){
        return !!this.groupKeys.length;
    }

    get finalIndexes(){

        return this.hasGrouping ? this.groupsSortedIndexes : this.noGroupsSortedIndexes;
    }

    constructor(){
        makeAutoObservable( this, {
            shallowGroupsStore: false,
            groupedSorted: computed({ equals: () => false }),
            groupsSortedIndexes: computed({ equals: () => false }),
            noGroupsSortedIndexes: computed({ equals: () => false }),
            finalIndexes: computed({ equals: () => false }),
            filteredIndexes: computed({ equals: () => false }),
            orderedIndexes: computed({ equals: () => false })
        });
    }

    merge( propertiesObj ){
        Object.assign( this, propertiesObj );
    }
}

export default RowsAggregator;