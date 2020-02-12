import EventEmitter from "eventemitter3";
import throttle from "lodash/throttle";
import areArraysEqual from "../utils/areArraysEqual";

import {
    updateNodeAt,
    getIndexAtDist,
    getEndIndexFromStartIndex,
    getTree,
    sum,
    reallocateIfNeeded
} from "./treeUtils";

const DEFAULT_ESTIMATED_ROW_HEIGHT = 30;

class VirtualRowsDataStore {

    Events = new EventEmitter();

    totalRows = 0;
    startIndex = 0;
    endIndex = 0;

    /* We re-measure a row only when it appears in dom */
    prevMeasuredRangeStartIndex = -1;
    prevMeasuredRangeEndIndex = -1;

    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    overscanRowsDistance = 0;
    estimatedRowHeight = 0;

    scrollLeft = 0;
    scrollTop = 0;

    widgetHeight = 0;
    widgetWidth = 0;

    columns = [];
    tbodyColumnWidths = [];

    setEstimatedRowHeight( height ){
        if( this.estimatedRowHeight !== height ){
            this.estimatedRowHeight = height;
            this.Events.emit( "estimated-row-height-changed", height );
        }
    }

    resetMeasuredRangeCache = () => {
        this.prevMeasuredRangeEndIndex = this.prevMeasuredRangeStartIndex = -1;
    }

    calculateTbodyColumnWidths = throttle(() => {
        const node = this.getTbodyDomNode();
        if( node ){
            for( let j = 0, ch = node.children, trChildren; j < ch.length; j++ ){
                trChildren = ch[ j ].children;
                if( trChildren.length === this.columns.length ){
                    /* we must select "correct" rows without colspans, etc. */
                    const pixelWidths = [];
                    for( let td of trChildren ){
                        pixelWidths.push( td.offsetWidth );
                    }
                    if( !areArraysEqual( this.tbodyColumnWidths, pixelWidths ) ){
                        this.tbodyColumnWidths = pixelWidths;
                        this.Events.emit( "column-widths-changed" );
                    }
                    break;
                }
            }
        }
    }, 200 );

    setVisibleRowsHeights = () => {
        this.setVisibleRowsHeightsThrottled.cancel();
        const node = this.getTbodyDomNode();

        if( node ){

            const { startIndex, endIndex, prevMeasuredRangeEndIndex, prevMeasuredRangeStartIndex } = this;

            for( let j = startIndex, ch = node.children, newHeight; j < endIndex; j++ ){
                if( j >= prevMeasuredRangeStartIndex && j < prevMeasuredRangeEndIndex ){
                    continue;
                }
                newHeight = ch[ j - startIndex ].offsetHeight;
                updateNodeAt( j, newHeight, this.heighsCache );
            }

            this.prevMeasuredRangeStartIndex = startIndex;
            this.prevMeasuredRangeEndIndex = endIndex;

            this.updateWidgetScrollHeight();
        }
    };

    setVisibleRowsHeightsThrottled = throttle( this.setVisibleRowsHeights, 1000, { leading: false } );

    reset(){
        this.heighsCache = getTree( this.totalRows, 0, this.estimatedRowHeight  );

        this.tbodyColumnWidths.length = this.columns.length;
        this.tbodyColumnWidths.fill( 0, 0, this.columns.length );

        this.virtualTopOffset = this.scrollTop = 0;
        this.startIndex = 0;

        this.resetMeasuredRangeCache();
        this.updateWidgetScrollHeight();
        this.updateVisibleRowsRange( this.startIndex );
    }

    updateWidgetScrollHeight(){
        const newWidgetScrollHeight = sum( 0, this.totalRows, this.heighsCache );
        if( newWidgetScrollHeight !== this.widgetScrollHeight ){
            this.widgetScrollHeight = newWidgetScrollHeight;
            this.Events.emit( "widget-scroll-height-changed", newWidgetScrollHeight );
        }
    }

    constructor( params ){
        this.getTbodyDomNode = params.getTbodyDomNode;
        this.getScrollContainerNode = params.getScrollContainerNode;
        this.overscanRowsDistance = params.overscanRowsDistance || 0;
        this.estimatedRowHeight = params.estimatedRowHeight || DEFAULT_ESTIMATED_ROW_HEIGHT;
        this.totalRows = params.totalRows || 0;
        this.columns = params.columns || [];
        this.reset();

        this.Events
            .on( "widget-height-changed", () => this.updateVisibleRowsRange( this.startIndex ) )
            .on( "tbody-rows-rendered", this.setVisibleRowsHeights )
            .on( "tbody-rows-rendered", this.calculateTbodyColumnWidths )
            .on( "columns-changed", this.resetMeasuredRangeCache )
            .on( "columns-changed", this.calculateTbodyColumnWidths )
            .on( "widget-width-changed", this.resetMeasuredRangeCache )
            .on( "widget-width-changed", this.setVisibleRowsHeightsThrottled )
            .on( "widget-width-changed", this.calculateTbodyColumnWidths );
    }

    destructor(){
        this.calculateTbodyColumnWidths.cancel();
        this.setVisibleRowsHeightsThrottled.cancel();
        this.Events.removeAllListeners();
    }
    
    setTotalRows( totalRows ){
        const prevTotalRows = this.totalRows;
        if( prevTotalRows !== totalRows ){
            this.totalRows = totalRows;
            this.heighsCache = reallocateIfNeeded( this.heighsCache, totalRows, this.estimatedRowHeight );
            this.updateWidgetScrollHeight();
            this.updateVisibleRowsRange( this.startIndex );
        }
    }

    scrollToRow( index ){
        const node = this.getScrollContainerNode();
        if( node ){
            index = Math.max( 0, Math.min( this.totalRows, index ) );
            const dist = sum( 0, index, this.heighsCache );
            node.scrollTop = dist;
        }        
    }

    setColumns( columns ){
        if( columns !== this.columns ){
            this.columns = columns;
            this.Events.emit( "columns-changed" );
        }
    }

    setScrollLeft( scrollLeft ){
        if( scrollLeft !== this.scrollLeft ){
            this.scrollLeft = scrollLeft;
            this.Events.emit( "scroll-left-changed", scrollLeft );
        }
    }

    setScrollTop( scrollTop ){
        if( this.scrollTop !== scrollTop ){
            this.scrollTop = scrollTop;
            const dist = Math.max( 0, scrollTop - this.overscanRowsDistance );
            const [ newStartIndex, remainder ] = getIndexAtDist( 1, dist, this.heighsCache );
            this.setVirtualTopOffset( dist - remainder );
            if( this.startIndex !== newStartIndex ){
                this.updateVisibleRowsRange( newStartIndex );
            }
        }
    }

    setVirtualTopOffset( newVirtualTopOffset ){
        if( this.virtualTopOffset !== newVirtualTopOffset ){
            this.virtualTopOffset = newVirtualTopOffset;
            this.Events.emit( "virtual-top-offset-changed" );
        }
    }

    updateVisibleRowsRange( newStartIndex ){
        let [ newEndIndex ] = getEndIndexFromStartIndex( newStartIndex, this.widgetHeight + this.overscanRowsDistance * 2, this.heighsCache );
        newEndIndex = Math.min( this.totalRows, newEndIndex );
        if( this.startIndex !== newStartIndex || this.endIndex !== newEndIndex ){
            this.startIndex = newStartIndex;
            this.endIndex = newEndIndex;
            this.Events.emit( "visible-rows-range-changed" );
        }
    }

    setWidgetHeight( height ){
        if( this.widgetHeight !== height ){
            this.widgetHeight = height;
            this.Events.emit( "widget-height-changed", height );
        }
    }

    setWidgetWidth( width ){
        if( this.widgetWidth !== width ){
            this.widgetWidth = width;
            this.Events.emit( "widget-width-changed", width );
        }
    }
}

export default VirtualRowsDataStore;