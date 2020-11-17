const createComplexTable = SimpleTableClass => class extends SimpleTableClass {

    filteredRowIndexes = [];
    finalRowIndexes = [];

    groupedData = new Map();

    constructor( initialValues ){
        super( initialValues );

        this
            .addListener( this.processFiltering, "rowsQuantity" )
    }


    processFiltering(){
        for( let j = 0, i = 0, row; j < this.rowsQuantity; j++ ){
            if( true ){
                this.filteredRowIndexes.push( j );
            }
        }
    }

    processGrouping(){
        this.groupedData.clear();
   //     for(  )
    }

    processSorting( group ){
        for( let [ k, v ] of group ){
            if( Array.isArray( v ) ){
                v.sort();
            }
            else {
                this.processSorting( v );
            }
        }
    }

    writeSortedRowIndexes( group, i ){
        for( let [ k, v ] of group ){
            if( Array.isArray( v ) ){
                this.finalRowIndexes.set( v, i );
                i += v;
            }
            else{
                this.writeSortedRowIndexes( i );
            }
        }
    }
}

export default createComplexTable;