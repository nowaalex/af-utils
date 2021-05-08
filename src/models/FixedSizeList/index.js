import ListBase from "../ListBase";

import { ROWS_QUANTITY } from "constants/events";

class FixedSizeList extends ListBase {

    rowHeight = 0;

    setRowHeight( v ){
        if( v !== this.rowHeight ){
            this.rowHeight = v;
            this.remeasure();
        }
    }

    constructor(){
        super();

        this.on( this.measureRowsThrottled, ROWS_QUANTITY );
    }


    getIndex( offset ){
        /* rounding via bitwise hacks like |0 may not work here, because number may be > max(int32) */
        return this.rowHeight && Math.trunc( offset / this.rowHeight );
    }

    getOffset( index ){
        return index * this.rowHeight;
    }

    measureRows(){
        if( this.spacerNode && this.rowsQuantity ){
            this.setRowHeight( this.spacerNode.nextElementSibling?.offsetHeight || 0 );
        }
    }    
}

export default FixedSizeList;