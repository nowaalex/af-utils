import EventEmitter from "eventemitter3";
import throttle from "lodash/throttle";
import clamp from "lodash/clamp";

import {
    updateNodeAt,
    calculateParentsAt,
    getIndexAtDist,
    getTree,
    sum,
    reallocateIfNeeded
} from "./treeUtils";

const DEFAULT_ESTIMATED_ROW_HEIGHT = 30;

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
        const newWidgetScrollHeight = this.heighsCache[ 1 ];
        if( newWidgetScrollHeight !== this.widgetScrollHeight ){
            this.widgetScrollHeight = newWidgetScrollHeight;
            this.Events.emit( "widget-scroll-height-changed", newWidgetScrollHeight );
        }
        return this;
    }

    setEstimatedRowHeight( height ){
        if( this.estimatedRowHeight !== height ){
            this.estimatedRowHeight = height;
            this.Events.emit( "estimated-row-height-changed", height );
        }
        return this;
    }

    setVisibleRowsHeights = () => {
        this.setVisibleRowsHeightsThrottled.cancel();
        const node = this.getRowsContainerNode();

        if( node ){

            const { startIndex, endIndex } = this;

            for( let j = startIndex, ch = node.children, newHeight, tmpPos; j < endIndex; j++ ){
                newHeight = ch[ j - startIndex ].offsetHeight;
                tmpPos = updateNodeAt( j, newHeight, this.heighsCache );
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
    };

    setVisibleRowsHeightsThrottled = throttle( this.setVisibleRowsHeights, 1000, { leading: false } );

    constructor( params ){
        this.getRowsContainerNode = params.getRowsContainerNode;
        this.getScrollContainerNode = params.getScrollContainerNode;
        this.overscanRowsDistance = params.overscanRowsDistance || 0;
        this.estimatedRowHeight = params.estimatedRowHeight || DEFAULT_ESTIMATED_ROW_HEIGHT;
        this.totalRows = params.totalRows || 0;
        this.heighsCache = getTree( this.totalRows, this.estimatedRowHeight );
        
        this.Events
            .on( "widget-height-changed", () => this.updateVisibleRowsRange( this.startIndex ) )
            .on( "rows-rendered", this.setVisibleRowsHeights )
            .on( "widget-width-changed", this.setVisibleRowsHeightsThrottled );
    }

    destructor(){
        this.setVisibleRowsHeightsThrottled.cancel();
        this.Events.removeAllListeners();
    }
    
    reportRowsRendered(){
        this.Events.emit( "rows-rendered" );
    }
    
    setTotalRows( totalRows ){
        const prevTotalRows = this.totalRows;
        if( prevTotalRows !== totalRows ){
            this.totalRows = totalRows;
            if( totalRows > 0 ){
                if( prevTotalRows > 0 ){
                    this.heighsCache = reallocateIfNeeded( this.heighsCache, prevTotalRows, totalRows, this.estimatedRowHeight );
                    this
                        .updateWidgetScrollHeight()
                        .updateVisibleRowsRange( this.startIndex );
                }
                else{
                    this.heighsCache = getTree( this.totalRows, this.estimatedRowHeight );
                }
            }
            else{
                this.startIndex = this.endIndex = this.virtualTopOffset = this.scrollTop = 0;
            }
        }
        return this;
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

    setScrollTop( scrollTop ){
        if( this.scrollTop !== scrollTop ){
            this.scrollTop = scrollTop;
            const dist = Math.max( 0, scrollTop - this.overscanRowsDistance );
            const [ newStartIndex, remainder ] = getIndexAtDist( dist, this.heighsCache );
            this.setVirtualTopOffset( dist - remainder );
            if( this.startIndex !== newStartIndex ){
                this.updateVisibleRowsRange( newStartIndex );
            }
        }
        return this;
    }

    setWidgetHeight( widgetHeight ){
        if( this.widgetHeight !== widgetHeight ){
            this.widgetHeight = widgetHeight;
            this.Events.emit( "widget-height-changed", widgetHeight );
        }
        return this;
    }

    setWidgetWidth( widgetWidth ){
        if( this.widgetWidth !== widgetWidth ){
            this.widgetWidth = widgetWidth;
            this.Events.emit( "widget-width-changed", widgetWidth );
        }
        return this;
    }

    setVirtualTopOffset( newVirtualTopOffset ){
        if( this.virtualTopOffset !== newVirtualTopOffset ){
            this.virtualTopOffset = newVirtualTopOffset;
            this.Events.emit( "virtual-top-offset-changed" );
        }
        return this;
    }

    updateVisibleRowsRange( newStartIndex ){
        let [ newEndIndex ] = getIndexAtDist( this.virtualTopOffset + this.widgetHeight + this.overscanRowsDistance * 2, this.heighsCache );
        newEndIndex = Math.min( newEndIndex, this.totalRows );
        if( this.startIndex !== newStartIndex || this.endIndex !== newEndIndex ){
            this.startIndex = newStartIndex;
            this.endIndex = newEndIndex;
            this.Events.emit( "visible-rows-range-changed" );
        }
        return this;
    }
}

export default Base;