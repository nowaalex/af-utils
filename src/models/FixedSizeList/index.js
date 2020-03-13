import clamp from "lodash/clamp";
import EventEmitter from "../EventEmitter";

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

    set( paramName, paramValue ){

        if( process.env.NODE_ENV !== "production" ){
            if( !this.hasOwnProperty( paramName ) ){
                throw new Error( `Trying to merge key, which does not exist: ${paramName}` );
            }
        }

        if( this[ paramName ] !== paramValue ){
            this[ paramName ] = paramValue;
            this.emit( `#${paramName}` );
        }

        return this;
    }
    
    merge( params ){
        for( let k in params ){
            this.set( k, params[ k ] );
        }
        return this;
    }
    
    updateWidgetScrollHeight(){
        return this.set( "widgetScrollHeight", this.rowHeight * this.totalRows );
    }

    refreshOffsets(){
        const { scrollTop, rowHeight } = this;
        const newVisibleStartIndex = scrollTop / rowHeight | 0;
        const remainder = scrollTop % rowHeight;
        const newStartIndex = Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
        const overscanOffset = ( newVisibleStartIndex - newStartIndex ) * rowHeight;
                
        return this
            .set( "virtualTopOffset", newTopOffset - remainder - overscanOffset )
            .set( "startIndex", newStartIndex );
    }

    updateEndIndex(){
        const newVisibleEndIndex = Math.ceil(( this.scrollTop + this.widgetHeight ) / this.rowHeight );
        const newEndIndex = Math.min( newVisibleEndIndex + this.overscanRowsCount, this.totalRows );
        return this.set( "endIndex", newEndIndex );
    }

    constructor(){
        super();
        
        this
            .on( "#totalRows", this.updateWidgetScrollHeight )
            .on( "#totalRows", this.updateEndIndex )
            .on( "#scrollTop", this.refreshOffsets )
            .on( "#overscanRowsCount", this.refreshOffsets )
            .on( "#widgetHeight", this.updateEndIndex )
            .on( "#startIndex", this.updateEndIndex );
    }

    destructor(){
        this.removeAllListeners();
    }
    
    reportRowsRendered(){
        this.emit( "rows-rendered" );
    }

    getNodeScrollTopForRowIndex( clampedRowIndex ){
        return this.rowHeight * clampedRowIndex;
    }

    scrollToRow( index ){
        const node = this.scrollContainerNode;
        if( node ){
            index = clamp( index, 0, this.totalRows );
            node.scrollTop = this.getNodeScrollTopForRowIndex( index );
        }
        return this;    
    }

    scrollToStart(){
        return this.scrollToRow( 0 );
    }
};

export default FixedSizeList;