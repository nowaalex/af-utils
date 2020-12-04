import { makeAutoObservable, comparer, computed } from "mobx"; 
import multiGroupBy from "./utils/multiGroupBy";
import sortGroups from "./utils/sortGroups";
import flattenGroups from "./utils/flattenGroups";
import getSorter from "./utils/getSorter";

class RowsAggregator {

    /* Provided from renderer */
    rowsQuantity = 0;
    getRowData = null;
    columns = [];
    compact = true;

    /* Calculated inside model */
    filtersMap = new Map();
    groupKeys = [];
    sortDataKey = "";
    sortDirection = -1;

    collapsedGroups = new Set();

    get visibleColumns(){
        return this.columns.filter( col => !this.groupKeys.includes( col.dataKey ) );
    }

    get priorityGroupValuesArray(){
        return this.groupKeys.map( dataKey => this.columns.find( c => c.dataKey === dataKey ).priorityGroupValues || [] );
    }

    setFiltering( dataKey, value ){
        if( value ){
            this.filtersMap.set( dataKey, value.toLowerCase() );
        }
        else{
            this.filtersMap.delete( dataKey );
        }
    }

    toggleCompact(){
        this.compact = !this.compact;
    }

    setSorting( dataKey ){
        if( this.sortDataKey === dataKey ){
            this.sortDirection *= -1;
        }
        this.sortDataKey = dataKey;
    }

    setGrouping( dataKeysArray ){
        this.groupKeys = dataKeysArray;
    }

    addGrouping( dataKey ){
        if( !this.groupKeys.includes( dataKey ) ){
            this.groupKeys.push( dataKey );
            this.collapsedGroups.clear();
        }
    }

    toggleCollapsedGroup( idx ){
        if( this.collapsedGroups.has( idx ) ){
            this.collapsedGroups.delete( idx );
        }
        else{
            this.collapsedGroups.add( idx );
        }
    }

    removeGrouping( dataKey ){
        const idx = this.groupKeys.indexOf( dataKey );
        if( idx !== -1 ){
            this.groupKeys.splice( idx, 1 );
            this.collapsedGroups.clear();
        }
    }

    get orderedIndexes(){
        return Array.from({ length: this.rowsQuantity }, ( v, i ) => i );
    }

    get grouped(){
        return multiGroupBy( this.filteredIndexes, this.groupKeys, this.getRowData, this.priorityGroupValuesArray );
    }

    get groupedSorted(){
        if( this.sortDataKey ){
            sortGroups( this.grouped, this.getRowData, this.sortDataKey, this.sortDirection, this.groupKeys.length );
        }
        return this.grouped;
    }

    get flattenedGroups(){
        return flattenGroups( this.groupedSorted, this.collapsedGroups );
    }

    get filteredIndexes(){
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
            visibleColumns: computed({ equals: comparer.structural }),
            priorityGroupValuesArray: computed({ equals: comparer.structural }),
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