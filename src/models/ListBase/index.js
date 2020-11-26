import PubSub from "../PubSub";
import throttle from "utils/throttle";

import {
    START_INDEX,
    END_INDEX,
    ROWS_QUANTITY,
    WIDGET_SCROLL_HEIGHT,
} from "constants/events";

class ListBase extends PubSub {

    /* Provided from renderer */
    scrollTop = 0;
    rowsQuantity = 0;
    /* must not be >= 1 */
    overscanRowsCount = 2;
    widgetHeight = 0;
    estimatedRowHeight = 0;
    rowsContainerNode = null;
    scrollContainerNode = null;

    setScrollContainerNode( node ){
        this.scrollContainerNode = node;
    }

    setScrollTop( v ){
        if( v !== this.scrollTop ){
            this.scrollTop = v;
            this.updateVisibleRange();
        }
    }

    setWidgetDimensions( height ){
        if( height !== this.widgetHeight ){
            this.widgetHeight = height;
            this.updateEndIndex();
        }

        this.measureRowsThrottled();
    }

    updateEndIndex(){
        const endIndex = Math.min( this.rowsQuantity, this.getIndex( this.scrollTop + this.widgetHeight ) + this.overscanRowsCount );

        if( endIndex !== this.endIndex ){
            this.endIndex = endIndex;
            this.emit( END_INDEX );
        }

        return this;
    }

    updateVisibleRange(){

        const startIndex = Math.max( 0, Math.min( this.rowsQuantity, this.getIndex( this.scrollTop ) ) - this.overscanRowsCount );

        if( startIndex !== this.startIndex ){
            this.startIndex = startIndex;
            this.virtualTopOffset = this.getOffset( startIndex );
            this.emit( START_INDEX );
        }

        return this.updateEndIndex();
    }


    /* must be called when row height/heights change */
    remeasure(){
        return this
            .updateWidgetScrollHeight()
            .updateVisibleRange();
    }

    constructor(){
        super()

        this
            .on( this.updateWidgetScrollHeight, ROWS_QUANTITY )
            .on( this.updateEndIndex, ROWS_QUANTITY );
    }

    destructor(){
        this.measureRowsThrottled.cancel();
        super.destructor();
    }

    scrollToRow( rowIndex ){
        if( this.scrollContainerNode ){
            this.scrollContainerNode.scrollTop = this.getOffset( rowIndex );
        }
        else if( process.env.NODE_ENV !== "production" ){
            console.error( "scrollContainerNode is not set" );
        }
    }

    updateWidgetScrollHeight(){
        const v = this.getOffset( this.rowsQuantity );
        if( v !== this.widgetScrollHeight ){
            this.widgetScrollHeight = v;
            this.emit( WIDGET_SCROLL_HEIGHT );
        }
        return this;
    }

    

    setViewParams( estimatedRowHeight, overscanRowsCount, rowsQuantity, rowsContainerNode ){

        this.estimatedRowHeight = estimatedRowHeight;
        this.rowsContainerNode = rowsContainerNode;

        this.startBatch();

        if( overscanRowsCount !== this.overscanRowsCount ){
            this.overscanRowsCount = overscanRowsCount;
            this.queue( this.updateVisibleRange );
        }

        if( rowsQuantity !== this.rowsQuantity ){
            this.rowsQuantity = rowsQuantity;
            this.emit( ROWS_QUANTITY );
        }

        this.endBatch();
    }

    measureRowsThrottled = throttle( this.measureRows, 200, this );

    /* Calculated inside model */
    startIndex = 0;
    endIndex = 0;
    virtualTopOffset = 0;
    widgetScrollHeight = 0;
}

export default ListBase;