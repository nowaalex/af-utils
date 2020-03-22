import clamp from "lodash/clamp";
import EventEmitter from "./EventEmitter";
import debounce from "lodash/debounce";

const getRowDataInitial = () => {
    throw new Error( "getRowData must be provided" );
};

const END_INDEX_CHECK_INTERVAL = 400;
const DEFAULT_ESTIMATED_ROW_HEIGHT = 16;

class ListBase extends EventEmitter {

    totalRows = 0;
    startIndex = 0;
    endIndex = 0;

    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    overscanRowsCount = 0;
    estimatedRowHeight = DEFAULT_ESTIMATED_ROW_HEIGHT;

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
    
    constructor(){
        super();
        
        if( process.env.NODE_ENV !== "production" ){
            const absentMethods = [
                "updateEndIndex",
                "updateStartOffset",
                "updateWidgetScrollHeight",
                "getDistanceBetweenIndexes"
            ].filter( fn => !this[ fn ] );

            if( absentMethods.length ){
                throw new Error( `Absent methods: ${absentMethods.join( "," )}` );
            }
        }

        this
            .on( "#totalRows", this.updateWidgetScrollHeight )
            .on( "#totalRows", this.updateEndIndex )
            .on( "#widgetScrollHeight", this.increaseEndIndexIfNeeded )
            .on( "#endIndex", this.increaseEndIndexIfNeeded.cancel )
            .on( "#scrollTop", this.updateStartOffset )
            .on( "#overscanRowsCount", this.updateStartOffset )
            .on( "#widgetHeight", this.updateEndIndex )
            .on( "#startIndex", this.updateEndIndex );
    }

    /*
        Column heights may change during scroll/width-change
    */
    increaseEndIndexIfNeeded = debounce(() => {
        const currentVisibleDist = this.getDistanceBetweenIndexes( this.startIndex, this.endIndex );
        if( this.widgetHeight > this.virtualTopOffset + currentVisibleDist - this.scrollTop ){
            this.updateEndIndex();
        }
        return this;
    }, END_INDEX_CHECK_INTERVAL );

    destructor(){
        this.increaseEndIndexIfNeeded.cancel();
        this.removeAllListeners();
    }
    
    reportRowsRendered(){
        this.emit( "rows-rendered" );
    }

    scrollToRow( index ){
        const node = this.scrollContainerNode;
        if( node ){
            index = clamp( index, 0, this.totalRows );
            node.scrollTop = this.getDistanceBetweenIndexes( 0, index );
        }
        return this;    
    }

    scrollToStart(){
        return this.scrollToRow( 0 );
    }
};

export default ListBase;