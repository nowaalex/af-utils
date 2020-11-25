import ListBase from "../ListBase";
import throttle from "utils/throttle";

import {
    START_INDEX,
    END_INDEX,
    ROWS_QUANTITY,
    WIDGET_WIDTH,
    WIDGET_HEIGHT,
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

        this.on( this.updateRowHeightThrottled, WIDGET_WIDTH, WIDGET_HEIGHT, ROWS_QUANTITY );
    }

    destructor(){
        this.updateRowHeightThrottled.cancel();
        super.destructor();
    }

    getIndex( offset ){
        return this.rowHeight && Math.floor( offset / this.rowHeight );
    }

    getOffset( index ){
        return index * this.rowHeight;
    }

    updateRowHeight(){
        if( this.rowsContainerNode && this.rowsQuantity ){
            this.setRowHeight( this.rowsContainerNode.firstElementChild?.offsetHeight || 0 );
        }
    }
    
    updateRowHeightThrottled = throttle( this.updateRowHeight, 200, this );
}

export default FixedSizeList;