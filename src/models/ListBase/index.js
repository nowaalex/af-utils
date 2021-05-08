import PubSub from "../PubSub";
import throttle from "utils/throttle";

import {
    START_INDEX,
    END_INDEX,
    ROWS_QUANTITY,
    WIDGET_SCROLL_HEIGHT,
    WIDGET_EXTRA_STICKY_HEIGHT
} from "constants/events";

class ListBase extends PubSub {

    /* Provided from renderer */
    scrollTop = 0;

    rowsQuantity = 0;

    /* must be >= 1 */
    overscanRowsCount = 2;

    widgetHeight = 0;

    /* sticky elements ( for example table header/footer ) must influence ONLY on widgetScrollHeight */
    extraStickyHeight = 0;

    estimatedRowHeight = 0;

    spacerNode = null;
    scrollContainerNode = null;
    rangeEndMoveHandler = null;

    setScrollContainerNode( node ){
        this.scrollContainerNode = node;
    }

    /* will ne used as callback, so => */
    setSpacerNode = node => {
        this.spacerNode = node;
    }

    setWidgetHeight = height => {
        if( height !== this.widgetHeight ){
            this.widgetHeight = height;
            this.updateEndIndex();
        }

        this.measureRowsThrottled();
    }

    setScrollTop( v ){
        if( v !== this.scrollTop ){
            this.scrollTop = v;
            this.updateVisibleRange();
        }
    }

    updateExtraStickyHeight( delta ){
        if( delta ){
            this.extraStickyHeight += delta;
            this.emit( WIDGET_EXTRA_STICKY_HEIGHT );
        }
    }

    updateEndIndex(){

        const endIndex = Math.min( this.getIndex( this.scrollTop + this.widgetHeight ) + this.overscanRowsCount, this.rowsQuantity );

        if( endIndex !== this.endIndex ){
            this.endIndex = endIndex;
            this.emit( END_INDEX );
        }

        return this;
    }

    updateVisibleRange(){

        this.startBatch();
        
        const startIndex = Math.max( 0, this.getIndex( this.scrollTop ) - this.overscanRowsCount );

        if( startIndex !== this.startIndex ){
            this.startIndex = startIndex;
            this.virtualTopOffset = this.getOffset( startIndex );
            this.emit( START_INDEX );
        }

        return this
            .updateEndIndex()
            .endBatch();
    }


    /* must be called when row height/heights change */
    remeasure(){
        return this
            .startBatch()
            .updateWidgetScrollHeight()
            .updateVisibleRange()
            .endBatch();
    }

    constructor(){
        super()

        this
            .on( this.updateWidgetScrollHeight, ROWS_QUANTITY )
            .on( this.updateEndIndex, ROWS_QUANTITY )
            .on( this.callRangeEndMoveHandler, ROWS_QUANTITY, END_INDEX );
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

    callRangeEndMoveHandler(){
        if( this.rangeEndMoveHandler ){
            this.rangeEndMoveHandler( this );
        }
    }

    setParams( estimatedRowHeight, overscanRowsCount, rowsQuantity, rangeEndMoveHandler ){

        this.estimatedRowHeight = estimatedRowHeight;

        this.startBatch();

        if( overscanRowsCount !== this.overscanRowsCount ){
            this.overscanRowsCount = overscanRowsCount;
            this.queue( this.updateVisibleRange );
        }

        if( rowsQuantity !== this.rowsQuantity ){
            this.rowsQuantity = rowsQuantity;
            this.emit( ROWS_QUANTITY );
        }

        if( !this.rangeEndMoveHandler ){
            this.queue( this.callRangeEndMoveHandler );
        }

        this.rangeEndMoveHandler = rangeEndMoveHandler || null;

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