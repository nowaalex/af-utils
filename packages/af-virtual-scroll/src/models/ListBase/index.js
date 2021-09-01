import PubSub from "../PubSub";
import throttle from "src/utils/throttle";

import {
    START_INDEX,
    END_INDEX,
    ROWS_QUANTITY,
    WIDGET_SCROLL_HEIGHT,
    WIDGET_EXTRA_STICKY_HEIGHT,
    WIDGET_HEIGHT,
    WIDGET_WIDTH
} from "src/constants/events";

class ListBase extends PubSub {

    /* Provided from renderer */
    scrollTop = 0;

    rowsQuantity = 0;

    /* must be >= 1 */
    overscanRowsCount = 2;

    widgetHeight = 0;
    widgetWidth = 0;

    /* sticky elements ( for example table header/footer ) must influence ONLY on widgetScrollHeight */
    extraStickyHeight = 0;

    estimatedRowHeight = 0;

    spacerNode = null;
    scrollContainerNode = null;

    setScrollContainerNode( node ){
        this.scrollContainerNode = node || null;
    }

    /* will ne used as callback, so => */
    setSpacerNode = node => {
        this.spacerNode = node;
    }

    updateWidgetDimensions = ({ offsetHeight, offsetWidth }) => {

        this.startBatch();

        if( offsetHeight !== this.widgetHeight ){
            this.widgetHeight = offsetHeight;
            this.emit( WIDGET_HEIGHT );
        }

        if( offsetWidth !== this.widgetWidth ){
            this.widgetWidth = offsetWidth;
            this.emit( WIDGET_WIDTH );
        }

        this.endBatch();
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

    measureRowsThrottled = throttle( this.measureRows, 200, this );

    constructor(){
        super()

        this
            .on( this.measureRowsThrottled, ROWS_QUANTITY, WIDGET_HEIGHT, WIDGET_WIDTH )
            .on( this.updateWidgetScrollHeight, ROWS_QUANTITY )
            .on( this.updateEndIndex, ROWS_QUANTITY, WIDGET_HEIGHT );
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

    setParams( estimatedRowHeight, overscanRowsCount, rowsQuantity ){

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

        this.endBatch();
    }

    /* Calculated inside model */
    startIndex = 0;
    endIndex = 0;
    virtualTopOffset = 0;
    widgetScrollHeight = 0;
}

export default ListBase;