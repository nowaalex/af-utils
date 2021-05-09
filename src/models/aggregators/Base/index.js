class Base {

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

    merge( propertiesObj ){
        Object.assign( this, propertiesObj );
    }
}

export default Base;