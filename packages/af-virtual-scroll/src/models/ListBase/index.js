import PubSub from "../PubSub";
import throttle from "utils/throttle";
import { observe, unobserve } from "utils/dimensionsObserver";

class ListBase extends PubSub {

    _scrollTop = 0;
    _overscanRowsCount = 0;
    _widgetHeight = 0;
    _widgetScrollHeight = 0;

    /* sticky elements ( for example table header/footer ) must influence ONLY on widgetScrollHeight */
    _extraStickyHeight = 0;

    _estimatedRowHeight = 0;

    _zeroChildNode = null;
    _scrollContainerNode = null;
    _innerNode = null;

    rowsQuantity = 0;
    from = 0;
    to = 0;

    _setScrollTop = e => {
        const diff = e.target.scrollTop - this._scrollTop;
        this._scrollTop += diff;

        if( diff > 0 ){
            this._updateRangeFromEnd();
        }
        else if( diff < 0 ) {
            this._updateRangeFromStart();
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
    _setZeroChildNode = node => {
        this._zeroChildNode = node;
    }

    /* will ne used as callback, so => */
    _setInnerNode = node => {
        this._innerNode = node;
        this._updateHeight();
    }

    _updateHeight(){
        if( this._innerNode ){
            this._innerNode.style.height = this._widgetScrollHeight + 'px';
        }
    }

    _updateExtraStickyHeight( delta ){
        /*
        TODO: DEBUG;
        
        if( delta !== 0 ){
            this._extraStickyHeight += delta;    
            this._updateHeight();
        }
        */
    }

    _updateRangeFromEnd(){
        const to = Math.min( this.rowsQuantity, 1 + this.getIndex( this._scrollTop + this._widgetHeight ) );

        if( to > this.to ){
            this.from = this.getIndex( this._scrollTop );
            this.to = Math.min( this.rowsQuantity, to + this._overscanRowsCount );
            this._run();
        }
    }

    _updateRangeFromStart(){
        const from = this.getIndex( this._scrollTop );

        if( from < this.from ){
            this.from = Math.max( 0, from - this._overscanRowsCount );
            this.to = Math.min( this.rowsQuantity, 1 + this.getIndex( this._scrollTop + this._widgetHeight ) );
            this._run();
        }
    }

    _clampTo(){
        if( this.to > this.rowsQuantity ){
            this.to = this.rowsQuantity;
            this.from = this.getIndex( Math.max( 0, this._widgetScrollHeight - this._widgetHeight ) );
            this._run();
        }
        else {
            /* if rowsQuantity 0 -> smth */
            this._updateRangeFromEnd();
        }
    }

    _measureRowsThrottled = throttle( this._measureRows, 300, this );

    _destroy(){
        this._unobserveCurrentScrollContainerNode();
        this._measureRowsThrottled._cancel();
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

    _reactOnUpdatedDimensions( newWidgetScrollHeight ){
        this._startBatch();
        this._setWidgetScrollHeight( newWidgetScrollHeight );
        this._updateRangeFromEnd();
        /*
            run must be called everytime,
            because dimensions change may change getOffset() behavior even if from/to did not change
        */
        this._run();
        this._endBatch();
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
            this._clampTo();
            this._measureRowsThrottled();
        }
    }
}

export default ListBase;