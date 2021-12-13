import PubSub from "../PubSub";
import throttle from "utils/throttle";
import { observe, unobserve } from "utils/dimensionsObserver";

class ListBase extends PubSub {

    _scrollPos = 0;
    _overscanCount = 0;
    _widgetHeight = 0;
    _widgetScrollHeight = 0;

    _estimatedItemSize = 0;

    _zeroChildNode = null;
    _outerNode = null;
    _innerNode = null;

    itemCount = 0;
    from = 0;
    to = 0;

    _setScrollPos = e => {
        const diff = e.target.scrollTop - this._scrollPos;
        this._scrollPos += diff;

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

        this._measureItemsThrottled();
    }

    _unobserveCurrentOuterNode(){
        if( this._outerNode ){
            unobserve( this._outerNode );
            this._outerNode.removeEventListener( "scroll", this._setScrollPos );
        }
    }

    /* will ne used as callback, so => */
    setOuterNode = node => {
        this._unobserveCurrentOuterNode();
        this._outerNode = node;
        if( node ){
            observe( node, this._updateWidgetDimensions );
            node.addEventListener( "scroll", this._setScrollPos, { passive: true });
        }
    }

    /* will ne used as callback, so => */
    setZeroChildNode = node => {
        this._zeroChildNode = node;
    }

    /* will ne used as callback, so => */
    setInnerNode = node => {
        this._innerNode = node;
        this._updateSize();
    }

    _updateSize(){
        if( this._innerNode ){
            this._innerNode.style.height = this._widgetScrollHeight + 'px';
        }
    }

    _updateRangeFromEnd(){
        const to = Math.min( this.itemCount, 1 + this.getIndex( this._scrollPos + this._widgetHeight ) );

        if( to > this.to ){
            this.from = this.getIndex( this._scrollPos );
            this.to = Math.min( this.itemCount, to + this._overscanCount );
            this._run();
        }
    }

    _updateRangeFromStart(){
        const from = this.getIndex( this._scrollPos );

        if( from < this.from ){
            this.from = Math.max( 0, from - this._overscanCount );
            this.to = Math.min( this.itemCount, 1 + this.getIndex( this._scrollPos + this._widgetHeight ) );
            this._run();
        }
    }

    _clampTo(){
        if( this.to > this.itemCount ){
            this.to = this.itemCount;
            this.from = this.getIndex( Math.max( 0, this._widgetScrollHeight - this._widgetHeight ) );
            this._run();
        }
        else {
            /* if itemCount 0 -> smth */
            this._updateRangeFromEnd();
        }
    }

    _measureItemsThrottled = throttle( this._measureItems, 300, this );

    _destroy(){
        this._unobserveCurrentOuterNode();
        this._measureItemsThrottled._cancel();
        super._destroy();
    }

    scrollTo( index ){
        if( this._outerNode ){
            this._outerNode.scrollTop = this.getOffset( index );
        }
        else if( process.env.NODE_ENV !== "production" ){
            console.error( "outerNode is not set" );
        }
    }

    _setWidgetScrollHeight( v ){
        /*
            TODO: crushes without if check.
        */
        if( this._widgetScrollHeight !== v ){
            this._widgetScrollHeight = v;
            this._updateSize();
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

    _setParams( estimatedItemSize, overscanCount, itemCount ){

        this._estimatedItemSize = estimatedItemSize;

        /*
            No need to waste extra render reacting on this prop.
            Normally it should not be changed.
        */
        this._overscanCount = overscanCount;

        if( itemCount !== this.itemCount ){
            this.itemCount = itemCount;
            this._itemCountChanged();
            this._clampTo();
            this._measureItemsThrottled();
        }
    }
}

export default ListBase;