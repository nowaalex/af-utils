import ListBase from "../ListBase";

import {
    START_INDEX,
    END_INDEX,
    ROWS_QUANTITY,
    WIDGET_SCROLL_HEIGHT,
} from "constants/events";

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
        return this.rowHeight && Math.floor( offset / this.rowHeight );
    }

    getOffset( index ){
        return index * this.rowHeight;
    }

    measureRows(){
        if( this.rowsContainerNode && this.rowsQuantity ){
            this.setRowHeight( this.rowsContainerNode.firstElementChild?.offsetHeight || 0 );
        }
    }    
}

export default FixedSizeList;