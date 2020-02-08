import EventEmitter from "eventemitter3";
import throttle from "lodash/throttle";
import areArraysEqual from "../utils/areArraysEqual";

const DEFAULT_APPROXIMATE_ROW_HEIGHT = 30;
const DEFAULT_ROW_RECALC_INTERVAL = 300;
const PX_OVERSCAN_DIST = 300;

class VirtualRowsDataStore {

    Events = new EventEmitter;
    rowHeightsByIndex = [];
    registeredRows = 0;
    totalRows = 0;

    startIndex = 0;
    endIndex = 0;

    /* We re-measure a row only when it appears in dom */
    prevMeasuredRangeStartIndex = -1;
    prevMeasuredRangeEndIndex = -1;

    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    averageRowHeight = 0;
    fallbackAverageRowHeight = 0;
    scrollHeight = 0;
    scrollLeft = 0;
    scrollTop = 0;
    scrollBuff = 0;
    widgetHeight = 0;
    widgetWidth = 0;

    columns = [];
    tbodyColumnWidths = [];

    setAverageRowHeight( height ){
        if( this.averageRowHeight !== height ){
            this.averageRowHeight = height;
            this.Events.emit( "average-row-height-changed", height );
        }
    }

    resetMeasuredRangeCache = () => {
        this.prevMeasuredRangeEndIndex = this.prevMeasuredRangeStartIndex = -1;
    }

    calculateTbodyColumnWidths = throttle(() => {
        for( let j = 0, ch = this.getTbodyDomNode().children, trChildren; j < ch.length; j++ ){
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
    }, 200 );

    setVisibleRowsHeights = throttle(() => {
        const { rowHeightsByIndex, startIndex, endIndex, prevMeasuredRangeEndIndex, prevMeasuredRangeStartIndex } = this;
        let { averageRowHeight } = this;
        for( let j = 0, idx, ch = this.getTbodyDomNode().children, curHeight, newHeight, diff, avgDiff; j < ch.length; j++ ){
            idx = j + startIndex;
            if( idx < prevMeasuredRangeStartIndex || idx >= prevMeasuredRangeEndIndex ){
                curHeight = rowHeightsByIndex[ idx ] || 0;
                newHeight = ch[ j ].offsetHeight;
                diff = newHeight - curHeight;   
                if( diff ){
                    rowHeightsByIndex[ idx ] = newHeight;
                    if( !curHeight ){
                        this.registeredRows++;
                        avgDiff = newHeight - averageRowHeight;
                    }
                    else{
                        avgDiff = diff;
                    }
                    averageRowHeight += avgDiff / this.registeredRows;
                }
            }
        }
        this.prevMeasuredRangeStartIndex = startIndex;
        this.prevMeasuredRangeEndIndex = endIndex;
        this.setAverageRowHeight( averageRowHeight );
    }, DEFAULT_ROW_RECALC_INTERVAL, { leading: false });

    refreshMeasurements = () => {
        const newWidgetScrollHeight = Math.ceil( this.averageRowHeight * this.totalRows ); 
        this.updateVirtualPosition( this.virtualTopOffset, this.startIndex, newWidgetScrollHeight );
    }

    constructor( params ){
        this.getTbodyDomNode = params.getTbodyDomNode;
        this.getTableWrapperDomNode = params.getTableWrapperDomNode;
        this.fallbackAverageRowHeight = params.approximateRowHeight || DEFAULT_APPROXIMATE_ROW_HEIGHT;
        this.totalRows = params.totalRows || 0;
        this.columns = params.columns || [];

        this.Events
            .on( "average-row-height-changed", this.refreshMeasurements )
            .on( "widget-height-changed", this.refreshMeasurements )
            .on( "visible-rows-range-changed", this.setVisibleRowsHeights )
            .on( "visible-rows-range-changed", this.calculateTbodyColumnWidths )
            .on( "columns-changed", this.calculateTbodyColumnWidths )
            .on( "widget-width-changed", this.resetMeasuredRangeCache )
            .on( "widget-width-changed", this.setVisibleRowsHeights )
            .on( "widget-width-changed", this.calculateTbodyColumnWidths );
    }

    destructor(){
        this.setVisibleRowsHeights.cancel();
        this.calculateTbodyColumnWidths.cancel();
        this.Events.removeAllListeners();
    }

    getRowsQuantity( startIndex, pxHeight, cutLast ){
        const { averageRowHeight, fallbackAverageRowHeight, rowHeightsByIndex, totalRows } = this;
        
        const step = Math.sign( pxHeight ),
            absHeight = Math.abs( pxHeight );

        let accumulatedHeight = 0,
            tmpHeight = 0;

        do {
            tmpHeight = rowHeightsByIndex[ startIndex ];
            if( !tmpHeight ){
                if( averageRowHeight ){
                    tmpHeight = rowHeightsByIndex[ startIndex ] = averageRowHeight;
                    this.registeredRows++;
                }
                else{
                    tmpHeight = fallbackAverageRowHeight;
                }
            }
            accumulatedHeight += tmpHeight;
            startIndex += step;
        }
        while( accumulatedHeight <= absHeight && startIndex < totalRows && startIndex >= 0 );

        if( cutLast ){
            startIndex -= step;
            accumulatedHeight -= tmpHeight;
        }

        return [ startIndex, Math.round( accumulatedHeight ) ];
    }
    
    setTotalRows( totalRows ){
        if( this.totalRows !== totalRows ){
            this.totalRows = totalRows;
            this.Events.emit( "total-rows-quantity-changed", totalRows );
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
        const prevScrollTop = this.scrollTop;
        const scrollDist = scrollTop - prevScrollTop;
        if( scrollDist ){
            this.scrollTop = scrollTop;
            if( scrollTop ){
              
                let newVirtualTopOffset = this.virtualTopOffset;

                if( scrollDist * this.scrollBuff < 0 ){
                    this.scrollBuff = prevScrollTop - newVirtualTopOffset;
                }

                const totalHeight = this.scrollBuff + scrollDist - PX_OVERSCAN_DIST;
                const [ newStartIndex, virtualOffsetDiff ] = this.getRowsQuantity( this.startIndex, totalHeight, true ); 
        
                if( virtualOffsetDiff ){
                    const dist = virtualOffsetDiff * Math.sign( scrollDist );
                    newVirtualTopOffset = Math.max( 0, this.virtualTopOffset + dist );
                    this.scrollBuff = scrollTop - newVirtualTopOffset;
                    this.updateVirtualPosition( newVirtualTopOffset, newStartIndex, this.widgetScrollHeight );
                }
                else{
                    this.scrollBuff += scrollDist;
                }
            }
            else{
                /* scrolled to the very start */
                this.scrollBuff = 0;
                this.updateVirtualPosition( 0, 0, this.widgetScrollHeight );
            }
        }
    }

    updateRowsRange( newStartIndex, newEndIndex ){
        if( this.endIndex !== newEndIndex || this.startIndex !== newStartIndex ){
            this.startIndex = newStartIndex;
            this.endIndex = newEndIndex;
            this.Events.emit( "visible-rows-range-changed" );
        }
    }

    updateScrollOffsets( newVirtualTopOffset, newWidgetScrollHeight ){
        if( this.widgetScrollHeight !== newWidgetScrollHeight || this.virtualTopOffset !== newVirtualTopOffset ){
            this.virtualTopOffset = newVirtualTopOffset;
            this.widgetScrollHeight = newWidgetScrollHeight;
            this.Events.emit( "virtual-scroll-offsets-changed" );
        }
    }

    updateVirtualPosition( newVirtualTopOffset, newStartIndex, newWidgetScrollHeight ){
        const [ newEndIndex ] = this.getRowsQuantity( newStartIndex, this.widgetHeight + PX_OVERSCAN_DIST * 2 );
        this.updateScrollOffsets( newVirtualTopOffset, newWidgetScrollHeight );
        this.updateRowsRange( newStartIndex, newEndIndex );
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

    /* TODO: add elements removing */
}

export default VirtualRowsDataStore;