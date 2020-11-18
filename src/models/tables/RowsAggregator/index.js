import PubSub from "../../basic/PubSub";

class RowsAggregator extends PubSub {

    /* Provided from renderer */
    rowsQuantity = 0;
    getRowData = null;

    /* Calculated inside model */
    orderedRows = [];

    sortBy( dataKey ){
        this.orderedRows.sort(( a, b ) => {
            const row1 = this.getRowData( a );
            const row2 = this.getRowData( b );

            if( row1 && row2 ){
                const v1 = row1[ dataKey ];
                const v2 = row2[ dataKey ];
                return v1 > v2 ? 1 : v1 < v2 ? -1 : 0;
            }

            return row1 ? 1 : row2 ? -1 : 0;
        });
        
        
        this.emit( "orderedRows" );
    }

    constructor( initialValues ){
        super();

        this
            .on( this.updateRowsQuantity, "rowsQuantity" )
            .merge( initialValues );
    }

    updateRowsQuantity(){
        this.set( "orderedRows", Array.from({ length: this.rowsQuantity }, ( v, i ) => i ) );
    }
}

export default RowsAggregator;