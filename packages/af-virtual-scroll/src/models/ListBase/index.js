import PubSub from "../PubSub";
import throttle from "utils/throttle";
import { observe, unobserve } from "utils/dimensionsObserver";

import {
    EVT_RANGE,
    EVT_ROWS_QUANTITY
} from "constants/events";

class ListBase extends PubSub {

    _scrollTop = 0;

    rowsQuantity = 0;
    _overscanRowsCount = 0;

    _widgetHeight = 0;

    /* sticky elements ( for example table header/footer ) must influence ONLY on widgetScrollHeight */
    _extraStickyHeight = 0;

    _estimatedRowHeight = 0;

    _spacerNode = null;
    _scrollContainerNode = null;
    _heightNode = null;


    /* Calculated inside model */
    from = 0;
    to = 0;
    _virtualTopOffset = 0;
    _widgetScrollHeight = 0;

    _setScrollTop = e => {
        /*
            No check is needed here;
            Assuming, that view layer does not trigger this with same value each time
        */
        const diff = e.target.scrollTop - this._scrollTop;
        this._scrollTop += diff;
        if( diff > 0 ){
            this._updateRangeFromEnd();
        }
        else {
            this._updateRangeFromStart();
        }
        if( this._spacerNode ){
            this._spacerNode.style.height = `${this._virtualTopOffset}px`;
        }
    }

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
            this._scrollContainerNode.removeEventListener( "scroll", this._setScrollTop );
        }
    }

    /* will ne used as callback, so => */
    _setScrollContainerNode = node => {
        this._unobserveCurrentScrollContainerNode();
        this._scrollContainerNode = node;
        if( node ){
            observe( node, this._updateWidgetDimensions );
            node.addEventListener( "scroll", this._setScrollTop, { passive: true });
        }
    }

    /* will ne used as callback, so => */
    _setSpacerNode = node => this._spacerNode = node;

    /* will ne used as callback, so => */
    _setHeightNode = node => this._heightNode = node;

    _updateHeight(){
        if( this._heightNode ){
            this._heightNode.style.height = ( this._widgetScrollHeight + this._extraStickyHeight ) + 'px';
        }
    }

    _updateExtraStickyHeight( delta ){
        if( delta !== 0 ){
            this._extraStickyHeight += delta;
            this._updateHeight();
        }
    }

    _updateRangeFromEnd(){
        const to = Math.min( this.rowsQuantity, this.getIndex( this._scrollTop + this._widgetHeight ) + 1 );

        if( to >= this.to ){
            this.from = this.getIndex( this._scrollTop );
            this.to = Math.min( this.rowsQuantity, to + this._overscanRowsCount );
            this._virtualTopOffset = this.getOffset( this.from );
            this._emit( EVT_RANGE );
        }
    }

    _updateRangeFromStart(){
        const from = this.getIndex( this._scrollTop );

        if( from <= this.from ){
            this.from = Math.max( 0, from - this._overscanRowsCount );
            this.to = Math.min( this.rowsQuantity, 1 + this.getIndex( this._scrollTop + this._widgetHeight ) );
            this._virtualTopOffset = this.getOffset( this.from );
            this._emit( EVT_RANGE );
        }
    }

    _measureRowsThrottled = throttle( this._measureRows, 300, this );

    _destroy(){
        this._unobserveCurrentScrollContainerNode();
        this._measureRowsThrottled.cancel();
        super._destroy();
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
        if( this._widgetScrollHeight !== v ){
            this._widgetScrollHeight = v;
            this._updateHeight();
        }
    }

    _setParams( estimatedRowHeight, overscanRowsCount, rowsQuantity ){

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
}

export default ListBase;