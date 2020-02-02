import EventEmitter from "eventemitter3";
import debounce from "lodash/debounce";

const DEFAULT_APPROXIMATE_ROW_HEIGHT = 30;
const DEFAULT_ROW_RECALC_INTERVAL = 300;

class VirtualRowsDataStore {

    Events = new EventEmitter;

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
    widgetHeight = 0;

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

    setVisibleRowsHeights = () => {
        const { rowHeightsByIndex, startIndex, endIndex } = this;
        for( let j = 0, ch = this.getTbodyDomNode().children, curHeight, newHeight, avgDiff; j < ch.length; j++ ){
            curHeight = rowHeightsByIndex[ j + startIndex ];
            newHeight = ch[ j ].offsetHeight;
            if( curHeight !== newHeight ){
                rowHeightsByIndex[ j + startIndex ] = newHeight;
                if( !curHeight ){
                    this.registeredRows++;
                    avgDiff = newHeight - this.averageRowHeight;
                }
                else{
                    avgDiff = newHeight - curHeight;
                }
                this.setAverageRowHeight( this.averageRowHeight + avgDiff / this.registeredRows );
            }
        }
    }

    setVisibleRowsHeightsDebounced = debounce( this.setVisibleRowsHeights, DEFAULT_ROW_RECALC_INTERVAL );

    constructor( params ){

        if( !params || !params.getTbodyDomNode ){
            throw new Error( "params.getTbodyDomNode must be provided to VirtualRowsDataStore constructor" );
        }

        this.getTbodyDomNode = params.getTbodyDomNode;
        this.fallbackAverageRowHeight = params.approximateRowHeight || DEFAULT_APPROXIMATE_ROW_HEIGHT;
        this.totalRows = params.totalRows || 0;

        this.Events
            .once( "average-row-height-changed", this.__refreshEndIndex )
            .on( "widget-height-changed", this.__refreshEndIndex )
            .on( "visible-rows-range-changed", this.setVisibleRowsHeightsDebounced );
    }

    destructor(){
        this.setVisibleRowsHeightsDebounced.cancel();
        this.Events.removeAllListeners();
    }

    getRowsQuantity( startIndex, pxHeight, cutLast ){
        /* TODO: unoptimal! Sums must be cached in fenwick tree */
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

    setScrollLeft( scrollLeft ){
        if( scrollLeft !== this.scrollLeft ){
            this.scrollLeft = scrollLeft;
            this.Events.emit( "scroll-left-changed", scrollLeft );
        }
    }

    setScrollTop( scrollTop ){
        const [ newStartIndex, newVirtualTopOffset ] = this.getRowsQuantity( 0, scrollTop, true );
        const [ newEndIndex, newVisibleDist ] = this.getRowsQuantity( newStartIndex, this.widgetHeight );
        this.virtualTopOffset = newVirtualTopOffset;
        this.virtualBottomOffset = Math.round( this.averageRowHeight * this.totalRows ) - newVirtualTopOffset - newVisibleDist;
        this.Events.emit( "scroll-top-changed" );
        this.__setVisibleRowsRange( newStartIndex, newEndIndex );
        console.log( this );
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

    /* TODO: add elements removing */
}

export default VirtualRowsDataStore;