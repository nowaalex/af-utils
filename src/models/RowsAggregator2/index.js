import PubSub from "../PubSub";
import multiGroupBy from "./utils/multiGroupBy";
import sortGroups from "./utils/sortGroups";
import flattenGroups from "./utils/flattenGroups";
import getSorter from "./utils/getSorter";
import getFilteredIndexes from "./utils/getFilteredIndexes";

import {
    FILTERING,
    GROUPING,
    SORTING,
    COMPACT_MODE,
    VISIBLE_COLUMNS,
    COLLAPSED_GROUPS,
    ROW_INDEXES,
    
    COMPLEX_EVENTS_ARRAY_LENGTH,
} from "constants/events";

class RowsAggregator extends PubSub {

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

    filteredIndexes = [];
    rowIndexes = [];
    groupValues = null;
    grouped = new Map();
    visibleColumns = [];

    constructor(){
        super( COMPLEX_EVENTS_ARRAY_LENGTH );

        this
            .on( this.updateFiltering, FILTERING )
            .on( this.expandAllGroups, GROUPING )
            .on( this.updateFlattened, COLLAPSED_GROUPS, SORTING )
    }

    getColumnByDataKey( dataKey ){
        return this.columns.find( c => c.dataKey === dataKey );
    }

    get priorityGroupValuesArray(){
        return this.groupKeys.map( dataKey => this.columns.find( c => c.dataKey === dataKey ).priorityGroupValues || [] );
    }

    toggleCollapsedGroup( idx ){
        if( this.collapsedGroups.has( idx ) ){
            this.collapsedGroups.delete( idx );
        }
        else{
            this.collapsedGroups.add( idx );
        }
        this.emit( COLLAPSED_GROUPS );
    }

    expandAllGroups(){
        if( this.collapsedGroups.size ){
            this.collapsedGroups.clear();
            this.emit( COLLAPSED_GROUPS );
        }
    }

    setFiltering( dataKey, value ){
        if( value ){
            this.filtersMap.set( dataKey, value.toLowerCase() );
        }
        else{
            this.filtersMap.delete( dataKey );
        }
        this.updateFiltering();
    }

    updateVisibleColumns(){
        this.visibleColumns = this.columns.filter( col => !this.groupKeys.includes( col.dataKey ) );
        this.emit( VISIBLE_COLUMNS );
    }

    updateFiltering(){
        this.startBatch();
        this.filteredIndexes = getFilteredIndexes( this.rowsQuantity, this.getRowData, this.filtersMap );
        this.updateGrouping();
        this.endBatch();
    }

    updateGrouping(){
        this.startBatch();
        this.grouped.clear();
        if( this.hasGrouping ){
            multiGroupBy( this.grouped, this.filteredIndexes, this.groupKeys, this.getRowData, this.priorityGroupValuesArray );
        }
        this.updateSorting();
        this.endBatch();
    }

    updateFlattened(){
        const [ groupValues, rowIndexes ] = flattenGroups( this.grouped, this.collapsedGroups );
        this.groupValues = groupValues;
        this.rowIndexes = rowIndexes;
        this.emit( ROW_INDEXES );
    }

    updateSorting(){
        if( this.hasGrouping ){
            if( this.sortDataKey ){
                sortGroups( this.grouped, this.getRowData, this.sortDataKey, this.sortDirection, this.groupKeys.length );
                this.updateFlattened();
            }
        }
        else {
            this.filteredIndexes.sort( getSorter( this.getRowData, this.sortDataKey, this.sortDirection ) );
            this.rowIndexes = this.filteredIndexes;
            this.groupValues = null;
            this.emit( ROW_INDEXES );
        }
    }

    setSorting( dataKey ){
        if( this.sortDataKey === dataKey ){
            this.sortDirection *= -1;
        }
        this.sortDataKey = dataKey;
        this.emit( SORTING );
        this.updateSorting();
    }

    setGrouping( dataKeysArray ){
        this.groupKeys = dataKeysArray;
        this.emit( GROUPING );
    }

    addGrouping( dataKey ){
        if( !this.groupKeys.includes( dataKey ) ){
            this.groupKeys.push( dataKey );
            this.emit( GROUPING );
        }
    }
    
    removeGrouping( dataKey ){
        const idx = this.groupKeys.indexOf( dataKey );
        if( idx !== -1 ){
            this.groupKeys.splice( idx, 1 );
            this.emit( GROUPING );
        }
    }

    get hasGrouping(){
        return !!this.groupKeys.length;
    }

    toggleCompact(){
        this.compact = !this.compact;
        this.emit( COMPACT_MODE );
    }

    merge( propertiesObj ){
        Object.assign( this, propertiesObj );
    }
}

export default RowsAggregator;