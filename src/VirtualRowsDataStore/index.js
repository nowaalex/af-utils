import EventEmitter from "eventemitter3";
import throttle from "lodash/throttle";
import areArraysEqual from "../utils/areArraysEqual";

const DEFAULT_ESTIMATED_ROW_HEIGHT = 30;

class VirtualRowsDataStore {

    Events = new EventEmitter();

    rowHeightsByIndex = [];
    measuredRowsQuantity = 0;
    measuredRowsTotalHeight = 0;

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
    scrollBuff = 0;

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
    }, 500 );

    setVisibleRowsHeights = () => {
        const node = this.getTbodyDomNode();

        if( node ){

            const { rowHeightsByIndex, startIndex, endIndex, prevMeasuredRangeEndIndex, prevMeasuredRangeStartIndex } = this;

            let totalSum = 0,
                totalMeasuredElementsQuantity = 0;

            /* Dirty! Goes here on width change */
            if( node.children.length !== endIndex - startIndex ){
                return;
            }

            for( let j = startIndex, ch = node.children, curHeight, newHeight; j < endIndex; j++ ){

                curHeight = rowHeightsByIndex[ j ] || 0;
                newHeight = rowHeightsByIndex[ j ] = ch[ j - startIndex ].offsetHeight;
                
                totalSum += newHeight;
                totalMeasuredElementsQuantity++;
                this.measuredRowsTotalHeight += newHeight - curHeight;

                if( !curHeight ) {
                    this.measuredRowsQuantity++;
                }
            }

            /*this.prevMeasuredRangeStartIndex = startIndex;
            this.prevMeasuredRangeEndIndex = endIndex;*/

            if( !this.estimatedRowHeight && totalMeasuredElementsQuantity ){
                this.setEstimatedRowHeight( totalSum / totalMeasuredElementsQuantity );
            }

            this.updateWidgetScrollHeight();
        }
    };

    reset(){
        this.rowHeightsByIndex.length = this.totalRows;
        this.rowHeightsByIndex.fill( 0, 0, this.totalRows );

        this.tbodyColumnWidths.length = this.columns.length;
        this.tbodyColumnWidths.fill( 0, 0, this.columns.length );

        this.virtualTopOffset = this.scrollTop = this.scrollBuff = 0;
        this.measuredRowsQuantity = this.measuredRowsTotalHeight = this.estimatedRowHeight = 0;
        this.startIndex = 0;

        this.resetMeasuredRangeCache();
        this.updateWidgetScrollHeight();
        this.updateVisibleRowsRange( this.startIndex );
    }

    updateWidgetScrollHeight(){
        const avgRowHeight = this.estimatedRowHeight || DEFAULT_ESTIMATED_ROW_HEIGHT;
        const unmeasuredRowsQuantity = this.totalRows - this.measuredRowsQuantity;
        const newWidgetScrollHeight = this.measuredRowsTotalHeight + Math.round( avgRowHeight * unmeasuredRowsQuantity );
        if( newWidgetScrollHeight !== this.widgetScrollHeight ){
            this.widgetScrollHeight = newWidgetScrollHeight;
            this.Events.emit( "widget-scroll-height-changed", newWidgetScrollHeight );
        }
    }

    updateRowsQuantity = ( newTotalRows, prevTotalRows ) => {
        if( newTotalRows > 0 ){

            if( newTotalRows > prevTotalRows ){
                this.rowHeightsByIndex.length = newTotalRows;
                this.rowHeightsByIndex.fill( 0, prevTotalRows, newTotalRows );
                this.updateWidgetScrollHeight();
                this.updateVisibleRowsRange( this.startIndex );
            }
            else{
                /* TODO: need more clever action */
                this.scrollTop = 0;
                this.getScrollContainerNode().scrollTop = 0;
                this.reset();
            }
        }
        else{
            this.reset();
        }
    }

    constructor( params ){
        this.getTbodyDomNode = params.getTbodyDomNode;
        this.getScrollContainerNode = params.getScrollContainerNode;
        this.overscanRowsDistance = params.overscanRowsDistance || 0;
        this.totalRows = params.totalRows || 0;
        this.columns = params.columns || [];
        this.reset();

        this.Events
            .on( "total-rows-quantity-changed", this.updateRowsQuantity )
            .on( "estimated-row-height-changed", () => this.updateWidgetScrollHeight())
            .on( "estimated-row-height-changed", () => this.updateVisibleRowsRange( this.startIndex ) )
            .on( "widget-height-changed", () => this.updateVisibleRowsRange( this.startIndex ) )
            .on( "tbody-rows-rendered", this.setVisibleRowsHeights )
            .on( "tbody-rows-rendered", this.calculateTbodyColumnWidths )
            .on( "columns-changed", this.calculateTbodyColumnWidths )
            .on( "widget-width-changed", this.resetMeasuredRangeCache )
            .on( "widget-width-changed", this.setVisibleRowsHeights )
            .on( "widget-width-changed", this.calculateTbodyColumnWidths );
    }

    destructor(){
        this.calculateTbodyColumnWidths.cancel();
        this.Events.removeAllListeners();
    }

    getRowsQuantity( startIndex, pxHeight, cutLast ){
        const { estimatedRowHeight, rowHeightsByIndex, totalRows } = this;
        
        const step = Math.sign( pxHeight ),
            absHeight = Math.abs( pxHeight );

        let accumulatedHeight = 0,
            tmpHeight = 0;

        do {
            tmpHeight = rowHeightsByIndex[ startIndex ] || estimatedRowHeight || DEFAULT_ESTIMATED_ROW_HEIGHT;
            accumulatedHeight += tmpHeight;
            startIndex += step;
        }
        while( accumulatedHeight <= absHeight && startIndex < totalRows && startIndex >= 0 );

        if( cutLast ){
            startIndex -= step;
            accumulatedHeight -= tmpHeight;
        }

        return [ startIndex, Math.round( accumulatedHeight * step ) ];
    }
    
    setTotalRows( totalRows ){
        const prevTotalRows = this.totalRows;
        if( prevTotalRows !== totalRows ){
            this.totalRows = totalRows;
            this.Events.emit( "total-rows-quantity-changed", totalRows, prevTotalRows );
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

                if( scrollDist ^ this.scrollBuff < 0 ){
                    /* scroll direction changed */
                    this.scrollBuff = prevScrollTop - newVirtualTopOffset;
                }

                this.scrollBuff += scrollDist;
                const totalHeight = this.scrollBuff - this.overscanRowsDistance;

                /* this if is just to avoid useless getRowsQuantity call */
                if( totalHeight ^ this.scrollBuff >= 0 ){
                    const startIndexOffset = scrollDist < 0 && this.startIndex > 0 ? -1 : 0;
                
                    const [ newStartIndex, dist ] = this.getRowsQuantity( this.startIndex + startIndexOffset, totalHeight, true ); 
        
                    if( dist ){
                        newVirtualTopOffset = Math.max( 0, newVirtualTopOffset + dist );
                        this.scrollBuff = scrollTop - newVirtualTopOffset;
                        this.setVirtualTopOffset( newVirtualTopOffset );
                        this.updateVisibleRowsRange( newStartIndex - startIndexOffset );
                    }
                }
            }
            else{
                /* scrolled to the very start */
                this.scrollBuff = 0;
                this.setVirtualTopOffset( 0 );
                this.updateVisibleRowsRange( 0 );
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
        const [ newEndIndex ] = this.getRowsQuantity( newStartIndex, this.widgetHeight + this.overscanRowsDistance * 2 );
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