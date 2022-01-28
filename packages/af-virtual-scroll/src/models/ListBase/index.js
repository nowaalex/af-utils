import PubSub from "../PubSub";
import throttle from "utils/throttle";
import ResizeObserver from "models/ResizeObserver";
class ListBase extends PubSub {

    _scrollKey = "";
    _sizeKey = "";

    _OuterNodeResizeObserver = new ResizeObserver(() => {
        const size = this._outerNode[ this._sizeKey ];

        if( size !== this._widgetSize ){
            this._widgetSize = size;
            this._updateRangeFromEnd();
        }

        this._measureItemsThrottled();
    });

    _scrollPos = 0;
    _overscanCount = 0;
    _estimatedItemSize = 0;

    _zeroChildNode = null;
    _outerNode = null;

    _widgetSize = 0;
    scrollSize = 0;

    itemCount = 0;
    from = 0;
    to = 0;

    _setScrollPos = () => {
        const diff = this._outerNode[ this._scrollKey ] - this._scrollPos;
        this._scrollPos += diff;

        if( diff > 0 ){
            this._updateRangeFromEnd();
        }
        else if( diff < 0 ) {
            this._updateRangeFromStart();
        }
    }

    _unobserveCurrentOuterNode(){
        if( this._outerNode ){
            this._OuterNodeResizeObserver.unobserve( this._outerNode );
            this._outerNode.removeEventListener( "scroll", this._setScrollPos );
        }
    }

    /* will ne used as callback, so => */
    setOuterNode = node => {
        this._unobserveCurrentOuterNode();
        this._outerNode = node;
        if( node ){
            this._OuterNodeResizeObserver.observe( node );
            node.addEventListener( "scroll", this._setScrollPos, { passive: true });
        }
    }

    /* will ne used as callback, so => */
    setZeroChildNode = node => {
        this._zeroChildNode = node;
        if( node ){
            this._measureItemsThrottled();
        }
    }

    _updateRangeFromEnd(){
        const to = Math.min( this.itemCount, 1 + this.getIndex( this._scrollPos + this._widgetSize ) );

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
            this.to = Math.min( this.itemCount, 1 + this.getIndex( this._scrollPos + this._widgetSize ) );
            this._run();
        }
    }

    _clampTo(){
        if( this.to > this.itemCount ){
            this.to = this.itemCount;
            this.from = this.getIndex( Math.max( 0, this.scrollSize - this._widgetSize ) );
            this._run();
        }
        else {
            /* if itemCount 0 -> smth */
            this._updateRangeFromEnd();
        }
    }

    _measureItemsThrottled = throttle( this._measureItems, this );

    _destroy(){
        this._unobserveCurrentOuterNode();
        this._measureItemsThrottled._cancel();
    }

    scrollTo( index ){
        if( this._outerNode ){
            this._outerNode[ this._scrollKey ] = this.getOffset( index );
        }
        else if( process.env.NODE_ENV !== "production" ){
            console.error( "outerNode is not set" );
        }
    }

    _setScrollSize( v ){
        if( this.scrollSize !== v ){
            this.scrollSize = v;
            this._run();
        }
    }

    _reactOnUpdatedDimensions( newscrollSize ){
        this._startBatch();
        this._setScrollSize( newscrollSize );
        this._updateRangeFromEnd();
        /*
            run must be called everytime,
            because dimensions change may change getOffset() behavior even if from/to did not change
        */
        this._run();
        this._endBatch();
    }

    _setParams( estimatedItemSize, overscanCount, itemCount, horizontal ){

        this._estimatedItemSize = estimatedItemSize;

        /*
            No need to waste extra render reacting on this prop.
            Normally it should not be changed.
        */
        this._overscanCount = overscanCount;
        
        this._scrollKey = `scroll${horizontal ? "Left" : "Top"}`;
        this._sizeKey = `offset${horizontal ? "Width" : "Height"}`;

        if( itemCount !== this.itemCount ){
            this.itemCount = itemCount;
            this._startBatch();
            this._itemCountChanged();
            this._clampTo();
            this._measureItemsThrottled();
            this._endBatch();
        }
    }
}

export default ListBase;