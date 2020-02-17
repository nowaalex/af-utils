import EventEmitter from "eventemitter3";
import throttle from "lodash/throttle";
import clamp from "lodash/clamp";
import addSetters from "../../utils/addSetters";

import {
    updateNodeAt,
    calculateParentsAt,
    getIndexAtDist,
    getTree,
    sum,
    reallocateIfNeeded
} from "./treeUtils";

const DEFAULT_ESTIMATED_ROW_HEIGHT = 30;
const ROW_MEASUREMENT_THROTTLING_INTERVAL = 500;

class Base {

    Events = new EventEmitter();

    totalRows = 0;
    startIndex = 0;
    endIndex = 0;

    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    overscanRowsDistance = 0;
    estimatedRowHeight = 0;

    scrollTop = 0;
    widgetHeight = 0;
    widgetWidth = 0;

    heighsCache = null;
    /*
        Used to improve perf of segments tree and recalculate needed parents only once
    */
    updatedNodesSet = new Set();

    updateWidgetScrollHeight(){
        /* In segments tree 1 node is always sum of all elements */
        return this.setWidgetScrollHeight( this.heighsCache[ 1 ] );
    }

    setVisibleRowsHeights = throttle(() => {
        this.reactOnWidthChange.cancel();
        const node = this.getRowsContainerNode();

        if( node ){
            for( let child of node.children ){
                const newHeight = child.offsetHeight;
                /*
                    We can't rely on this.startIndex and this.endIndex here, because react updates DOM asynchronously
                    and current rendered rows range may differ from startIndex - endIndex, especially if there are many rows and this method is throttled.
                */
                const index = +child.getAttribute( "aria-rowindex" );
                if( process.env.NODE_ENV !== "production" && isNaN( index ) ){
                    throw new Error( "aria-rowindex attribute must be present on each row. Look at default Row implementations." );
                }
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
        TODO: maybe implement this cleaner?
    */
    reactOnWidthChange = throttle(() => {
        this
            .updateEndIndex()
            .setVisibleRowsHeights();
    }, 500 );

    refreshOffsets(){
        const dist = Math.max( 0, this.scrollTop - this.overscanRowsDistance );
        const [ newStartIndex, remainder ] = getIndexAtDist( dist, this.heighsCache );
        this
            .setVirtualTopOffset( dist - remainder )
            .setStartIndex( newStartIndex )
            .updateEndIndex();
    }

    updateEndIndex(){
        const [ newEndIndex ] = getIndexAtDist( this.virtualTopOffset + this.widgetHeight + this.overscanRowsDistance * 2, this.heighsCache );
        return this.setEndIndex( Math.min( newEndIndex, this.totalRows ) );
    }

    toggleBasicEvents( method ){
        this.Events
            [ method ]( "scroll-top-changed", this.refreshOffsets, this )
            [ method ]( "overscan-rows-distance-changed", this.refreshOffsets, this ) 
            [ method ]( "widget-height-changed", this.updateEndIndex, this )
            [ method ]( "rows-rendered", this.setVisibleRowsHeights )
            [ method ]( "widget-width-changed", this.reactOnWidthChange );
    }

    refreshHeightsCache( totalRows, prevTotalRows ){
        if( totalRows > 0 ){
            if( prevTotalRows > 0 ){
                this.heighsCache = reallocateIfNeeded( this.heighsCache, prevTotalRows, totalRows, this.estimatedRowHeight );
                this
                    .updateWidgetScrollHeight()
                    .updateEndIndex();
            }
            else{
                this.heighsCache = getTree( totalRows, this.estimatedRowHeight );
                this.toggleBasicEvents( "on" );
            }
        }
        else{
            this.reactOnWidthChange.cancel();
            this.setVisibleRowsHeights.cancel();
            this.startIndex = this.endIndex = this.virtualTopOffset = this.scrollTop = 0;
            this.toggleBasicEvents( "off" );
        }
    }

    constructor( params ){
        this.getRowsContainerNode = params.getRowsContainerNode;
        this.getScrollContainerNode = params.getScrollContainerNode;
        
        this.Events.on( "total-rows-changed", this.refreshHeightsCache, this )

        this
            .setEstimatedRowHeight( params.estimatedRowHeight || DEFAULT_ESTIMATED_ROW_HEIGHT )
            .setOverscanRowsDistance( params.overscanRowsDistance || 0 )
            .setTotalRows( params.totalRows || 0 );
    }

    destructor(){
        this.reactOnWidthChange.cancel();
        this.Events.removeAllListeners();
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
    "overscanRowsDistance",
    "startIndex",
    "endIndex",
    "totalRows"
]);

export default Base;