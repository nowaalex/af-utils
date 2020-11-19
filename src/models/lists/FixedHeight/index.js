import BaseClass from "../BaseClass";

import {
    START_INDEX,
    END_INDEX,
    SCROLL_TOP,
    ROWS_QUANTITY,
    OVERSCAN_ROWS_COUNT,
    WIDGET_WIDTH,
    WIDGET_HEIGHT,
    VIRTUAL_TOP_OFFSET,
    WIDGET_SCROLL_HEIGHT,
    ESTIMATED_ROW_HEIGHT,
    ROWS_CONTAINER_NODE,
    CACHED_ROWS_HEIGHT,
} from "constants/events";

class FixedHeight extends BaseClass {

    rowHeight = 0;

    setRowHeight( v ){
        if( v !== this.rowHeight ){
            this.rowHeight = v;
            this.e( CACHED_ROWS_HEIGHT );
        }
    }

    constructor(){
        super();

        this
            .on( this.updateRowHeight, WIDGET_WIDTH, WIDGET_HEIGHT, ROWS_CONTAINER_NODE, ROWS_QUANTITY, ESTIMATED_ROW_HEIGHT )
            .on( this.updateWidgetScrollHeight, CACHED_ROWS_HEIGHT, ROWS_QUANTITY );
    }

    updateStartIndex(){
        const v = Math.max( 0, Math.floor( this.scrollTop / this.rowHeight ) - this.overscanRowsCount );
        if( v !== this.startIndex ){
            this.startIndex = v;
            this.e( START_INDEX );
        }
    }

    updateEndIndex(){
        const v = Math.min( this.rowsQuantity, Math.floor( ( this.scrollTop + this.widgetHeight ) / this.rowHeight ) + this.overscanRowsCount );
        if( v !== this.endIndex ){
            this.endIndex = v;
            this.e( END_INDEX );
        }
    }

    updateWidgetScrollHeight(){
        const v = this.rowHeight * this.rowsQuantity;
        if( v !== this.widgetScrollHeight ){
            this.widgetScrollHeight = v;
            this.e( WIDGET_SCROLL_HEIGHT );
        }
    }

    updateVirtualTopOffset(){
        const v = this.startIndex * this.rowHeight;
        if( v !== this.virtualTopOffset ){
            this.virtualTopOffset = v;
            this.e( VIRTUAL_TOP_OFFSET );
        }
    }

    updateRowHeight(){
        if( this.widgetWidth && this.widgetHeight && this.rowsContainerNode && this.rowsQuantity ){
            const { firstElementChild } = this.rowsContainerNode;
            if( firstElementChild ){
                this.setRowHeight( firstElementChild.offsetHeight );
            }
        }
        else {
            this.setRowHeight( this.estimatedRowHeight )
        }
    }
}

export default FixedHeight;