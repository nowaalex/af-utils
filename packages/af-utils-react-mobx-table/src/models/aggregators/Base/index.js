class Base {

    /* Provided from renderer */
    itemCount = 0;
    getRowData = null;
    getTotalsFormattingHelper = null;
    columns = [];
    compact = true;

    /* Calculated inside model */
    filtersMap = new Map();
    groupKeys = [];
    sortDataKey = "";
    sortDirection = -1;

    collapsedGroups = new Set();

    setFiltering( key, value ){
        if( value ){
            this.filtersMap.set( key, value.toLowerCase() );
        }
        else{
            this.filtersMap.delete( key );
        }
    }

    toggleCompact(){
        this.compact = !this.compact;
    }

    setSorting( key ){
        if( this.sortDataKey === key ){
            this.sortDirection *= -1;
        }
        this.sortDataKey = key;
    }

    setGrouping( dataKeysArray ){
        this.groupKeys = dataKeysArray;
    }

    addGrouping( key ){
        if( !this.groupKeys.includes( key ) ){
            this.groupKeys.push( key );
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

    removeGrouping( key ){
        const idx = this.groupKeys.indexOf( key );
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