import PubSub from "../PubSub";
import throttle from "utils/throttle";
import { observe, unobserve } from "utils/dimensionsObserver";

import {
    START_INDEX,
    END_INDEX,
    ROWS_QUANTITY,
    WIDGET_SCROLL_HEIGHT,
    WIDGET_EXTRA_STICKY_HEIGHT,
    WIDGET_HEIGHT,
    WIDGET_WIDTH
} from "constants/events";

class ListBase extends PubSub {

    /* Provided from renderer */
    _scrollTop = 0;

    rowsQuantity = 0;

    /* must be >= 1 */
    _overscanRowsCount = 1;

    _widgetHeight = 0;
    _widgetWidth = 0;

    /* sticky elements ( for example table header/footer ) must influence ONLY on widgetScrollHeight */
    extraStickyHeight = 0;

    _estimatedRowHeight = 0;

    _spacerNode = null;
    _scrollContainerNode = null;

    _updateWidgetDimensions = ({ offsetHeight, offsetWidth }) => {

        this.startBatch();

        if( offsetHeight !== this._widgetHeight ){
            this._widgetHeight = offsetHeight;
            this._emit( WIDGET_HEIGHT );
        }

        if( offsetWidth !== this._widgetWidth ){
            this._widgetWidth = offsetWidth;
            this._emit( WIDGET_WIDTH );
        }

        this.endBatch();
    }

    _unobserveCurrentScrollContainerNode(){
        if( this._scrollContainerNode ){
            unobserve( this._scrollContainerNode );
        }
    }

    /* will ne used as callback, so => */
    setScrollContainerNode = node => {
        this._unobserveCurrentScrollContainerNode();
        this._scrollContainerNode = node || null;
        if( node ){
            observe( node, this._updateWidgetDimensions );
        }
    }

    /* will ne used as callback, so => */
    setSpacerNode = node => {
        this._spacerNode = node;
    }

    setScrollTop( v ){
        /*
            No check is needed here;
            Assuming, that view layer does not trigger this with same value each time
        */
        this._scrollTop = v;
        this._updateVisibleRange();
    }

    updateExtraStickyHeight( delta ){
        if( delta !== 0 ){
            this.extraStickyHeight += delta;
            this._emit( WIDGET_EXTRA_STICKY_HEIGHT );
        }
    }

    _updateEndIndex(){

        const endIndex = Math.min( this.getIndex( this._scrollTop + this._widgetHeight ) + this._overscanRowsCount, this.rowsQuantity );

        if( endIndex !== this.endIndex ){
            this.endIndex = endIndex;
            this._emit( END_INDEX );
        }
    }

    _updateVisibleRange(){

        this.startBatch();
        
        const startIndex = Math.max( 0, this.getIndex( this._scrollTop ) - this._overscanRowsCount );

        if( startIndex !== this.startIndex ){
            this.startIndex = startIndex;
            this.virtualTopOffset = this.getOffset( startIndex );
            this._emit( START_INDEX );
        }

        this._updateEndIndex()
        this.endBatch();
    }

    _measureRowsThrottled = throttle( this._measureRows, 300, this );

    constructor(){
        super()

        this
            .on( this._rowsQuantityChanged, ROWS_QUANTITY )
            .on( this._measureRowsThrottled, ROWS_QUANTITY, WIDGET_HEIGHT, WIDGET_WIDTH )
            .on( this._updateEndIndex, ROWS_QUANTITY, WIDGET_HEIGHT );
    }

    destructor(){
        this._unobserveCurrentScrollContainerNode();
        this._measureRowsThrottled.cancel();
        super.destructor();
    }

    scrollToRow( rowIndex ){
        if( this._scrollContainerNode ){
            this._scrollContainerNode.scrollTop = this.getOffset( rowIndex );
        }
        else if( process.env.NODE_ENV !== "production" ){
            console.error( "scrollContainerNode is not set" );
        }
    }

    _setWidgetScrollHeight( v ){
        /*
            TODO: crushes without if check.
        */
        if( this.widgetScrollHeight !== v ){
            this.widgetScrollHeight = v;
            this.startBatch();
            this._emit( WIDGET_SCROLL_HEIGHT );
            this._updateVisibleRange();
            this.endBatch();
        }
    }

    setParams( estimatedRowHeight, overscanRowsCount, rowsQuantity ){

        this._estimatedRowHeight = estimatedRowHeight;

        this.startBatch();

        if( overscanRowsCount !== this._overscanRowsCount ){
            this._overscanRowsCount = overscanRowsCount;
            this.queue( this._updateVisibleRange );
        }

        if( rowsQuantity !== this.rowsQuantity ){
            this.rowsQuantity = rowsQuantity;
            this._emit( ROWS_QUANTITY );
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