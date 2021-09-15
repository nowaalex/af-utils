import PubSub from "../PubSub";
import throttle from "utils/throttle";
import { observe, unobserve } from "utils/dimensionsObserver";

import {
    EVT_START_INDEX,
    EVT_END_INDEX,
    EVT_ROWS_QUANTITY,
    EVT_WIDGET_SCROLL_HEIGHT,
    EVT_WIDGET_EXTRA_STICKY_HEIGHT,
} from "constants/events";

class ListBase extends PubSub {

    /* Provided from renderer */
    _scrollTop = 0;

    rowsQuantity = 0;

    /* must be >= 1 */
    _overscanRowsCount = 1;

    _widgetHeight = 0;

    /* sticky elements ( for example table header/footer ) must influence ONLY on widgetScrollHeight */
    extraStickyHeight = 0;

    _estimatedRowHeight = 0;

    _spacerNode = null;
    _scrollContainerNode = null;

    _updateWidgetDimensions = ({ offsetHeight }) => {

        if( offsetHeight !== this._widgetHeight ){
            this._widgetHeight = offsetHeight;
            this._updateEndIndex();
        }

        this._measureRowsThrottled();
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

    _updateExtraStickyHeight( delta ){
        if( delta !== 0 ){
            this.extraStickyHeight += delta;
            this._emit( EVT_WIDGET_EXTRA_STICKY_HEIGHT );
        }
    }

    _updateEndIndex(){

        const endIndex = Math.min( this.getIndex( this._scrollTop + this._widgetHeight ) + this._overscanRowsCount, this.rowsQuantity );

        if( endIndex !== this.endIndex ){
            this.endIndex = endIndex;
            this._emit( EVT_END_INDEX );
        }
    }

    _updateVisibleRange(){
        
        const startIndex = Math.max( 0, this.getIndex( this._scrollTop ) - this._overscanRowsCount );

        if( startIndex !== this.startIndex ){
            this.startIndex = startIndex;
            this.virtualTopOffset = this.getOffset( startIndex );
            this._emit( EVT_START_INDEX );
        }

        this._updateEndIndex()
    }

    _measureRowsThrottled = throttle( this._measureRows, 300, this );

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
            this._emit( EVT_WIDGET_SCROLL_HEIGHT );
        }
    }

    setParams( estimatedRowHeight, overscanRowsCount, rowsQuantity ){

        this._estimatedRowHeight = estimatedRowHeight;

        /*
            No need to waste extra render reacting on this prop.
            Normally it should not be changed.
        */
        this._overscanRowsCount = overscanRowsCount;

        if( rowsQuantity !== this.rowsQuantity ){
            this.rowsQuantity = rowsQuantity;
            this._rowsQuantityChanged();
            this._updateVisibleRange();
            this._measureRowsThrottled();
            this._emit( EVT_ROWS_QUANTITY );
        }
    }

    /* Calculated inside model */
    startIndex = 0;
    endIndex = 0;
    virtualTopOffset = 0;
    widgetScrollHeight = 0;
}

export default ListBase;