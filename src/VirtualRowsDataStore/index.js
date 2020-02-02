import EventEmitter from "eventemitter3";
import debounce from "lodash/debounce";
import throttle from "lodash/throttle";
import areArraysEqual from "../utils/areArraysEqual";

const DEFAULT_APPROXIMATE_ROW_HEIGHT = 30;
const DEFAULT_ROW_RECALC_INTERVAL = 200;
const DEFAULT_ROW_RECALC_MAX_WAIT = 2000;

class VirtualRowsDataStore {

    Events = new EventEmitter;
    /*
        https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/fenwick-tree/FenwickTree.js
    */
    rowHeightsFenwickTree = [];
    rowHeightsByIndex = [];
    registeredRows = 0;
    totalRows = 0;

    startIndex = 0;
    endIndex = 0;

    virtualTopOffset = 0;
    virtualBottomOffset = 0;

    averageRowHeight = 0;
    fallbackAverageRowHeight = 0;
    scrollHeight = 0;
    scrollLeft = 0;
    scrollTop = 0;
    widgetHeight = 0;
    widgetWidth = 0;

    columns = [];
    tbodyColumnWidths = [];

    __refreshEndIndex = () => {
        const [ newEndIndex, newVisibleDist ] = this.getRowsQuantity( this.startIndex, this.widgetHeight );
        this.virtualBottomOffset = Math.round( this.averageRowHeight * this.totalRows ) - this.virtualBottomOffset - newVisibleDist;
        this.Events.emit( "scroll-top-changed" );
        this.__setVisibleRowsRange( this.startIndex, newEndIndex );
    }

    setAverageRowHeight( height ){
        if( this.averageRowHeight !== height ){
            this.averageRowHeight = height;
            this.Events.emit( "average-row-height-changed", height );
        }
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

    setVisibleRowsHeights = debounce(() => {
        const { rowHeightsByIndex, startIndex } = this;
        for( let j = 0, ch = this.getTbodyDomNode().children, curHeight, newHeight, diff, avgDiff; j < ch.length; j++ ){
            curHeight = rowHeightsByIndex[ j + startIndex ] || 0;
            newHeight = ch[ j ].offsetHeight;
            diff = newHeight - curHeight;   
            if( diff ){
                rowHeightsByIndex[ j + startIndex ] = newHeight;
                if( !curHeight ){
                    this.registeredRows++;
                    avgDiff = newHeight - this.averageRowHeight;
                }
                else{
                    avgDiff = diff;
                }
                this.setAverageRowHeight( this.averageRowHeight + avgDiff / this.registeredRows );
            }
        }
    }, DEFAULT_ROW_RECALC_INTERVAL, { maxWait: DEFAULT_ROW_RECALC_MAX_WAIT });

    constructor( params ){

        if( !params || !params.getTbodyDomNode ){
            throw new Error( "params.getTbodyDomNode must be provided to VirtualRowsDataStore constructor" );
        }

        this.getTbodyDomNode = params.getTbodyDomNode;
        this.fallbackAverageRowHeight = params.approximateRowHeight || DEFAULT_APPROXIMATE_ROW_HEIGHT;
        this.totalRows = params.totalRows || 0;
        this.columns = params.columns || [];

        this.Events
            .once( "average-row-height-changed", this.__refreshEndIndex )
            .on( "widget-height-changed", this.__refreshEndIndex )
            .on( "visible-rows-range-changed", this.setVisibleRowsHeights )
            .on( "visible-rows-range-changed", this.calculateTbodyColumnWidths )
            .on( "columns-changed", this.calculateTbodyColumnWidths )
            .on( "widget-width-changed", this.calculateTbodyColumnWidths );
    }

    destructor(){
        this.setVisibleRowsHeights.cancel();
        this.calculateTbodyColumnWidths.cancel();
        this.Events.removeAllListeners();
    }

    getRowsQuantity( startIndex, pxHeight, cutLast ){
        const { averageRowHeight, fallbackAverageRowHeight, rowHeightsByIndex, totalRows } = this;
        let accumulatedHeight = 0,
            tmpHeight = 0;

        do {
            tmpHeight = rowHeightsByIndex[ startIndex++ ] || averageRowHeight || fallbackAverageRowHeight;
            accumulatedHeight += tmpHeight;
        }
        while( accumulatedHeight <= pxHeight && startIndex < totalRows );

        return cutLast ? [ startIndex - 1, Math.round( accumulatedHeight - tmpHeight ) ] : [ startIndex, Math.round( accumulatedHeight ) ];
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
        if( scrollTop !== this.scrollTop ){
            this.scrollTop = scrollTop;
            const [ newStartIndex, newVirtualTopOffset ] = this.getRowsQuantity( 0, scrollTop, true );
            console.log( "F", this, newStartIndex );
            const [ newEndIndex, newVisibleDist ] = this.getRowsQuantity( newStartIndex, this.widgetHeight );
            this.virtualTopOffset = newVirtualTopOffset;
            this.virtualBottomOffset = Math.round( this.averageRowHeight * this.totalRows ) - newVirtualTopOffset - newVisibleDist;
            this.Events.emit( "scroll-top-changed" );
            this.__setVisibleRowsRange( newStartIndex, newEndIndex );
        // console.log( this );
        }
    }

    __setVisibleRowsRange( from, to ){
        if( this.startIndex !== from || this.endIndex !== to ){
            this.startIndex = from;
            this.endIndex = to;
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

    /* TODO: add elements removing */
}

export default VirtualRowsDataStore;