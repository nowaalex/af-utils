import EventEmitter from "eventemitter3";
import throttle from "lodash/throttle";
import debounce from "lodash/debounce";
import clamp from "lodash/clamp";
import addSetters from "../../utils/addSetters";

import {
    updateNodeAt,
    calculateParentsAt,
    walkUntil,
    sum,
    reallocateIfNeeded
} from "./treeUtils";

const DEFAULT_ESTIMATED_ROW_HEIGHT = 30;
const ROW_MEASUREMENT_THROTTLING_INTERVAL = 300;
const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;
const END_INDEX_CHECK_INTERVAL = 400;

class Base {

    Events = new EventEmitter();

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

    /*
        Used to set pointer-events: none when scrolling
    */
    isScrolling = false;

    heighsCache = null;

    /*
        Used to improve perf of segments tree and recalculate needed parents only once
    */
    updatedNodesSet = new Set();

    setInitialScrollingEvents(){
        this.Events
            .off( "scroll-top-changed", this.setIsScrollingFalseDebounced )
            .once( "scroll-top-changed", this.setIsScrollingTrue, this );
        return this;
    }

    setIsScrollingTrue(){
        this.isScrolling = true;
        this.Events
            .on( "scroll-top-changed", this.setIsScrollingFalseDebounced )
            .emit( "is-scrolling-changed" );
    }
    
    setIsScrollingFalseDebounced = debounce(() => {
        this.isScrolling = false;
        this.setInitialScrollingEvents()
            .Events.emit( "is-scrolling-changed" );
    }, IS_SCROLLING_DEBOUNCE_INTERVAL );

    updateWidgetScrollHeight(){
        /* In segments tree 1 node is always sum of all elements */
        return this.setWidgetScrollHeight( this.heighsCache[ 1 ] );
    }

    /*
        TODO: maybe some react-like performUnitOfWork logic is needed here?
    */
    setVisibleRowsHeights = throttle(() => {
        const node = this.getRowsContainerNode();

        if( node ){
            for( let child of node.children ){
                const newHeight = child.offsetHeight;
                /*
                    We can't rely on this.startIndex and this.endIndex here, because react updates DOM asynchronously
                    and current rendered rows range may differ from startIndex - endIndex, especially if there are many rows and this method is throttled.
                */
                if( process.env.NODE_ENV !== "production" && !child.hasAttribute( "aria-rowindex" ) ){
                    throw new Error( "aria-rowindex attribute must be present on each row. Look at default Row implementations." );
                }
                const index = +child.getAttribute( "aria-rowindex" );
                const tmpPos = updateNodeAt( index, newHeight, this.heighsCache );
                if( tmpPos ){
                    this.updatedNodesSet.add( tmpPos );
                }
            }

            if( this.updatedNodesSet.size ){
                calculateParentsAt( this.updatedNodesSet, this.heighsCache );
                this.updatedNodesSet.clear();
                this.updateWidgetScrollHeight();
            }
        }

        return this;
    }, ROW_MEASUREMENT_THROTTLING_INTERVAL );

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
        this.setIsScrollingFalseDebounced.cancel();
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
        const [ newEndIndex ] = walkUntil( this.scrollTop + this.widgetHeight, this.heighsCache );
        /*
            walkUntil works by "strict less" algo. It is good for startIndex,
            but for endIndex we need "<=", so adding 1 artificially.
        */
        return this.setEndIndex( Math.min( newEndIndex + 1 + this.overscanRowsCount, this.totalRows ) );
    }

    toggleBasicEvents( method ){
        this.Events
            [ method ]( "scroll-top-changed", this.refreshOffsets, this )
            [ method ]( "overscan-rows-distance-changed", this.refreshOffsets, this )
            [ method ]( "widget-scroll-height-changed", this.increaseEndIndexIfNeeded )
            [ method ]( "widget-height-changed", this.updateEndIndex, this )
            [ method ]( "rows-rendered", this.setVisibleRowsHeights )
            [ method ]( "start-index-changed", this.updateEndIndex, this )
            [ method ]( "end-index-changed", this.increaseEndIndexIfNeeded.cancel )
            [ method ]( "widget-width-changed", this.setVisibleRowsHeights );
        return this;
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
        this.getRowsContainerNode = params.getRowsContainerNode;
        this.getScrollContainerNode = params.getScrollContainerNode;
        
        this.Events.on( "total-rows-changed", this.refreshHeightsCache, this );

        this
            .setInitialScrollingEvents()
            .setEstimatedRowHeight( params.estimatedRowHeight || DEFAULT_ESTIMATED_ROW_HEIGHT )
            .setOverscanRowsCount( params.overscanRowsCount || 0 )
            .setTotalRows( params.totalRows || 0 );
    }

    destructor(){
        this
            .cancelPendingAsyncCalls()
            .Events.removeAllListeners();
    }
    
    reportRowsRendered(){
        this.Events.emit( "rows-rendered" );
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

addSetters( Base.prototype, [
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

export default Base;