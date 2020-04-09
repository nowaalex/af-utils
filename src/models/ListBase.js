import EventEmitter from "af-tools/lib/eventEmitters/Basic";
import debounce from "../utils/debounce";

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
                "updateWidgetScrollHeight",
                "getDistanceBetweenIndexes",
                "getVisibleRangeStart"
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
    increaseEndIndexIfNeededSync(){
        const currentVisibleDist = this.getDistanceBetweenIndexes( this.startIndex, this.endIndex );
        if( this.widgetHeight > this.virtualTopOffset + currentVisibleDist - this.scrollTop ){
            this.updateEndIndex();
        }
    }

    increaseEndIndexIfNeeded = debounce( this.increaseEndIndexIfNeededSync, END_INDEX_CHECK_INTERVAL );

    destructor(){
        this.increaseEndIndexIfNeeded.cancel();
        this.removeAllListeners();
    }

    updateStartOffset(){
        const { scrollTop, overscanRowsCount } = this;
        const [ newVisibleStartIndex, remainder ] = this.getVisibleRangeStart( scrollTop );
        const newStartIndex = Math.max( 0, newVisibleStartIndex - overscanRowsCount );
        const overscanOffset = this.getDistanceBetweenIndexes( newStartIndex, newVisibleStartIndex );
                
        return this
            .set( "virtualTopOffset", scrollTop - remainder - overscanOffset )
            .set( "startIndex", newStartIndex );
    }

    updateEndIndex(){
        const [ newEndIndex ] = this.getVisibleRangeStart( this.scrollTop + this.widgetHeight );
        /*
            getVisibleRangeStart works by "strict less" algo. It is good for startIndex,
            but for endIndex we need "<=", so adding 1 artificially.
        */
        return this.set( "endIndex", Math.min( newEndIndex + 1 + this.overscanRowsCount, this.totalRows ) );
    }

    scrollToRow( index ){
        const node = this.scrollContainerNode;
        if( node ){
            index = Math.max( 0, Math.min( index, this.totalRows ) );
            node.scrollTop = this.getDistanceBetweenIndexes( 0, index );
        }
        return this;    
    }

    scrollToStart(){
        return this.scrollToRow( 0 );
    }
};

export default ListBase;