import EventEmitter from "eventemitter3";
import debounce from "lodash/debounce";
import clamp from "lodash/clamp";
import addSetters from "../../utils/addSetters";

import {
    calculateParentsInRange,
    walkUntil,
    sum,
    reallocateIfNeeded
} from "./treeUtils";

const DEFAULT_ESTIMATED_ROW_HEIGHT = 30;
const ROW_MEASUREMENT_DEBOUNCE_INTERVAL = 50;
const ROW_MEASUREMENT_DEBOUNCE_MAXWAIT = 150;
const END_INDEX_CHECK_INTERVAL = 400;

class List extends EventEmitter {

    totalRows = 0;
    startIndex = 0;
    endIndex = 0;

    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    overscanRowsCount = 0;
    estimatedRowHeight = 0;

    scrollTop = 0;
    widgetHeight = 0;
    widgetWidth = 0;

    heighsCache = null;

    updateWidgetScrollHeight(){
        /* In segments tree 1 node is always sum of all elements */
        return this.setWidgetScrollHeight( this.heighsCache[ 1 ] );
    }

    /*
        TODO: maybe some react-like performUnitOfWork logic is needed here?
    */
    setVisibleRowsHeights = debounce(() => {
        const node = this.getRowsContainerNode();

        if( node ){
            
            /*
                TODO:
                    make tree[ 0 ] more obvious and self-documented
            */
            const tree = this.heighsCache,
                N = tree[ 0 ];
            
            let l = -1,
                r = -1;

            /*
                Some benchmarks inspire me to use nextElementSibling
                https://jsperf.com/nextsibling-vs-childnodes-increment/2
            */
            for( let child = node.firstElementChild, newHeight, index; child; child = child.nextElementSibling ){
                
                /*
                    * aria-rowindex is counted from 1 according to w3c spec;
                    * parseInt with radix is 2x faster, then +, -, etc.
                      https://jsperf.com/number-vs-parseint-vs-plus/116
                */
                index = parseInt( child.getAttribute( "aria-rowindex" ), 10 ) - 1;

                if( process.env.NODE_ENV !== "production" && Number.isNaN( index ) ){
                    throw new Error( "aria-rowindex attribute must be present on each row. Look at default Row implementations." );
                }

                newHeight = child.offsetHeight;
                

                if( tree[ N + index ] !== newHeight ){
                    // console.log( "%d| was: %d; is: %d", index, tree[N+index],newHeight)
                    tree[ N + index ] = newHeight;
                    
                    if( l === -1 ){
                        l = index;
                    }
                    
                    r = index;
                }
            }
 
            if( l !== -1 ){
                if( process.env.NODE_ENV !== "production" ){
                    console.log( "Updating heights in range: %d - %d", l, r );
                }
                calculateParentsInRange( l, r, tree );
                this.updateWidgetScrollHeight();
            }
        }

        return this;
    }, ROW_MEASUREMENT_DEBOUNCE_INTERVAL, { maxWait: ROW_MEASUREMENT_DEBOUNCE_MAXWAIT });

    /*
        Column widths && heights may change during scroll/width-change,
        especially if table layout is not fixed.
    */
    increaseEndIndexIfNeeded = debounce(() => {
        const currentVisibleDist = sum( this.startIndex, this.endIndex, this.heighsCache );
        if( this.widgetHeight > this.virtualTopOffset + currentVisibleDist - this.scrollTop ){
            this.updateEndIndex();
        }
        return this;
    }, END_INDEX_CHECK_INTERVAL );

    cancelPendingAsyncCalls(){
        this.setVisibleRowsHeights.cancel();
        this.increaseEndIndexIfNeeded.cancel();
        return this;
    }

    refreshOffsets(){

        const newTopOffset = this.scrollTop;
        const [ newVisibleStartIndex, remainder ] = walkUntil( newTopOffset, this.heighsCache );
        const newStartIndex = Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
        const overscanOffset = sum( newStartIndex, newVisibleStartIndex, this.heighsCache );
                
        return this
            .setVirtualTopOffset( newTopOffset - remainder - overscanOffset )
            .setStartIndex( newStartIndex );
    }

    updateEndIndex(){
        /*
            TODO:
                perf benchmarks tell, that removeChild is called often.
                maybe cache previous range( endIndex - startIndex ) and if new range is smaller - throttle it's decrease?
        */
        const [ newEndIndex ] = walkUntil( this.scrollTop + this.widgetHeight, this.heighsCache );
        /*
            walkUntil works by "strict less" algo. It is good for startIndex,
            but for endIndex we need "<=", so adding 1 artificially.
        */
        return this.setEndIndex( Math.min( newEndIndex + 1 + this.overscanRowsCount, this.totalRows ) );
    }

    toggleBasicEvents( method ){
        return this
            [ method ]( "scroll-top-changed", this.refreshOffsets, this )
            [ method ]( "overscan-rows-distance-changed", this.refreshOffsets, this )
            [ method ]( "widget-scroll-height-changed", this.increaseEndIndexIfNeeded )
            [ method ]( "widget-height-changed", this.updateEndIndex, this )
            [ method ]( "rows-rendered", this.setVisibleRowsHeights )
            [ method ]( "start-index-changed", this.updateEndIndex, this )
            [ method ]( "end-index-changed", this.increaseEndIndexIfNeeded.cancel )
            [ method ]( "widget-width-changed", this.setVisibleRowsHeights );
    }

    resetMeasurementsCache(){
        this.heighsCache = reallocateIfNeeded( this.heighsCache, this.totalRows, this.estimatedRowHeight );
        return this;
    }

    refreshHeightsCache( prevTotalRows ){
        if( this.totalRows > 0 ){
            if( prevTotalRows < 1 ){
                this.toggleBasicEvents( "on" );
            }
            this
                .resetMeasurementsCache()
                .updateWidgetScrollHeight();
        }
        else{
            this
                .cancelPendingAsyncCalls()
                .toggleBasicEvents( "off" );
            this.startIndex = this.endIndex = this.virtualTopOffset = this.scrollTop = 0;
        }
    }

    constructor( params ){
        super();

        this.getRowsContainerNode = params.getRowsContainerNode;
        this.getScrollContainerNode = params.getScrollContainerNode;
        
        this
            .on( "total-rows-changed", this.refreshHeightsCache, this )
            .setEstimatedRowHeight( params.estimatedRowHeight || DEFAULT_ESTIMATED_ROW_HEIGHT )
            .setOverscanRowsCount( params.overscanRowsCount || 0 )
            .setTotalRows( params.totalRows || 0 );
    }

    destructor(){
        this
            .cancelPendingAsyncCalls()
            .removeAllListeners();
    }
    
    reportRowsRendered(){
        this.emit( "rows-rendered" );
    }

    /*
        TODO: think, why this shit has ~20px fault
    */
    scrollToRow( index ){
        const node = this.getScrollContainerNode();
        if( node ){
            index = clamp( index, 0, this.totalRows );
            node.scrollTop = sum( 0, index, this.heighsCache );
        }
        return this;    
    }
}

addSetters( List.prototype, [
    "estimatedRowHeight",
    "virtualTopOffset",
    "scrollTop",
    "widgetWidth",
    "widgetHeight",
    "widgetScrollHeight",
    "overscanRowsCount",
    "startIndex",
    "endIndex",
    "totalRows",
    "rowKeyGetter"
]);

export default List;