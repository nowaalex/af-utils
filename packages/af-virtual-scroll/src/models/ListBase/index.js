import PubSub from "../PubSub";
import throttle from "utils/throttle";
import { observe, unobserve } from "utils/dimensionsObserver";

import {
    EVT_RANGE,
    EVT_ROWS_QUANTITY,
    EVT_WIDGET_SCROLL_HEIGHT,
    EVT_WIDGET_EXTRA_STICKY_HEIGHT,
} from "constants/events";

class ListBase extends PubSub {

    _scrollTop = 0;

    rowsQuantity = 0;
    _overscanRowsCount = 0;

    _widgetHeight = 0;

    /* sticky elements ( for example table header/footer ) must influence ONLY on widgetScrollHeight */
    extraStickyHeight = 0;

    _estimatedRowHeight = 0;

    _spacerNode = null;
    _scrollContainerNode = null;

    _updateWidgetDimensions = ({ offsetHeight }) => {

        if( offsetHeight !== this._widgetHeight ){
            this._widgetHeight = offsetHeight;
            this._updateRangeFromEnd();
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
        const isScrollingDown = v > this._scrollTop;
        this._scrollTop = v;
        if( isScrollingDown ){
            this._updateRangeFromEnd();
        }
        else {
            this._updateRangeFromStart();
        }
    }

    _updateExtraStickyHeight( delta ){
        if( delta !== 0 ){
            this.extraStickyHeight += delta;
            this._emit( EVT_WIDGET_EXTRA_STICKY_HEIGHT );
        }
    }

    _updateRangeFromEnd(){
        const to = Math.min( this.rowsQuantity, this.getIndex( this._scrollTop + this._widgetHeight ) + 1 );

        if( to >= this.to ){
            this.from = this.getIndex( this._scrollTop );
            this.to = Math.min( this.rowsQuantity, to + this._overscanRowsCount );
            this.virtualTopOffset = this.getOffset( this.from );
            this._emit( EVT_RANGE );
        }
    }

    _updateRangeFromStart(){
        const from = this.getIndex( this._scrollTop );

        if( from <= this.from ){
            this.from = Math.max( 0, from - this._overscanRowsCount );
            this.to = Math.min( this.rowsQuantity, 1 + this.getIndex( this._scrollTop + this._widgetHeight ) );
            this.virtualTopOffset = this.getOffset( this.from );
            this._emit( EVT_RANGE );
        }
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
            this._updateRangeFromEnd();
            this._measureRowsThrottled();
            this._emit( EVT_ROWS_QUANTITY );
        }
    }

    /* Calculated inside model */
    from = 0;
    to = 0;
    virtualTopOffset = 0;
    widgetScrollHeight = 0;
}

export default ListBase;