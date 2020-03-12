import EventEmitter from "eventemitter3";

const getRowDataInitial = () => {
    throw new Error( "getRowData must be provided" );
};

class FixedSizeList extends EventEmitter {

    totalRows = 0;
    startIndex = 0;
    endIndex = 0;

    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    overscanRowsCount = 0;
    rowHeight = 20;

    scrollTop = 0;
    widgetHeight = 0;
    widgetWidth = 0;

    rowKeyGetter = undefined;
    rowDataGetter = getRowDataInitial;
    rowsContainerNode = null;
    scrollContainerNode = null;

    merge( params ){
        for( let k in params ){
            this.set( k, params[ k ] );
        }
    }

    set( paramName, paramValue ){

        if( process.env.NODE_ENV !== "production" ){
            if( !this.hasOwnProperty( paramName ) ){
                throw new Error( `Trying to merge key, which does not exist: ${paramName}` );
            }
        }

        const prevValue = this[ paramName ];

        if( prevValue !== paramValue ){
            this[ paramName ] = paramValue;
            this.emit( `#${paramName}`, prevValue );
        }

        return this;
    }

    updateWidgetScrollHeight(){
        return this.set( "widgetScrollHeight", this.rowHeight * this.totalRows );
    }

    refreshOffsets(){
        const newTopOffset = this.scrollTop;
        const newVisibleStartIndex = newTopOffset / this.rowHeight | 0;
        const remainder = newTopOffset % this.rowHeight;
        const newStartIndex = Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
        const overscanOffset = ( newVisibleStartIndex - newStartIndex ) * this.rowHeight;
                
        return this
            .set( "virtualTopOffset", newTopOffset - remainder - overscanOffset )
            .set( "startIndex", newStartIndex );
    }

    updateEndIndex(){
        const newVisibleEndIndex = ( this.scrollTop + this.widgetHeight ) / this.rowHeight | 0;
        const newEndIndex = Math.min( newVisibleEndIndex + 1 + this.overscanRowsCount, this.totalRows );
        return this.set( "endIndex", newEndIndex );
    }

    toggleBasicEvents( method ){
        return this
            [ method ]( "#scrollTop", this.refreshOffsets, this )
            [ method ]( "#overscanRowsCount", this.refreshOffsets, this )
            [ method ]( "#widgetHeight", this.updateEndIndex, this )
            [ method ]( "#startIndex", this.updateEndIndex, this );
    }

    resetMeasurementsCache(){
        if( process.env.NODE_ENV !== "production" ){
            if( !this.estimatedRowHeight ){
                throw new Error( "estimatedRowHeight must be provided" );
            }
        }
        this.heighsCache = reallocateIfNeeded( this.heighsCache, this.totalRows, this.estimatedRowHeight );
        return this;
    }

    refreshHeightsCache( prevTotalRows ){
        if( this.totalRows > 0 ){
            if( prevTotalRows < 1 ){
                this.toggleBasicEvents( "on" );
            }

            this
                .updateWidgetScrollHeight()
                .updateEndIndex();
                
        }
        else{
            if( prevTotalRows > 0 ){
                this.toggleBasicEvents( "off" );
            }

            this.startIndex = this.endIndex = this.virtualTopOffset = this.scrollTop = 0;
        }
    }

    constructor(){
        super();
        
        this.on( "#totalRows", this.refreshHeightsCache, this );
    }

    destructor(){
        this.removeAllListeners();
    }
    
    reportRowsRendered(){
        this.emit( "rows-rendered" );
    }

    /* TODO: implement scrollToRow here */
};

export default FixedSizeList;