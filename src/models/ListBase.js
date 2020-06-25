import { extendObservable, decorate, computed, action } from "mobx";
import debounce from "../utils/debounce";

const getRowDataInitial = () => {
    throw new Error( "getRowData must be provided" );
}

const BASIC_OBSERVABLE_FIELDS = {
    totalRows: 0,
    overscanRowsCount: 0,
    estimatedRowHeightFallback: 0,

    scrollLeft: 0,
    scrollTop: 0,

    widgetHeight: 0,
    widgetWidth: 0,

    getRowKey: undefined,
    getRowData: getRowDataInitial
};

const END_INDEX_CHECK_INTERVAL = 400;

class ListBase {

    totalRows = 0;
    overscanRowsCount = 0;
    estimatedRowHeightFallback = 0;

    scrollLeft = 0;
    scrollTop = 0;

    widgetHeight = 0;
    widgetWidth = 0;

    getRowKey = undefined;
    getRowData = getRowDataInitial;

    rowsContainerNode = null;
    scrollContainerNode = null;

    get visibleRangeStart(){
        return this.getVisibleRangeStart( this.scrollTop );
    }

    get startIndex(){
        const [ newVisibleStartIndex ] = this.visibleRangeStart;
        return Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
    }

    get endIndex(){

        if( !this.estimatedRowHeight ){
            return 0;
        }
        
        const [ newEndIndex ] = this.getVisibleRangeStart( this.scrollTop + this.widgetHeight );

        /*
            getVisibleRangeStart works by "strict less" algo. It is good for startIndex,
            but for endIndex we need "<=", so adding 1 artificially.
        */
        return Math.min( newEndIndex + 1 + this.overscanRowsCount, this.totalRows );
    }

    get virtualTopOffset(){
        const [ newVisibleStartIndex, remainder ] = this.visibleRangeStart;
        const overscanOffset = this.getDistanceBetweenIndexes( this.startIndex, newVisibleStartIndex );
        return this.scrollTop - remainder - overscanOffset;
    }
    
    merge( params ){
        Object.assign( this, params );
    }

    /*
    
    constructor(){
        
        extendObservable( this, BASIC_OBSERVABLE_FIELDS );
        
        this
            .on( "#widgetScrollHeight", this.increaseEndIndexIfNeeded )
            .on( "#endIndex", this.increaseEndIndexIfNeeded.cancel );
        
    }

    */

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

decorate( ListBase, {

    totalRows: 0,
    overscanRowsCount: 0,
    estimatedRowHeightFallback: 0,

    scrollLeft: 0,
    scrollTop: 0,

    widgetHeight: 0,
    widgetWidth: 0,

    getRowKey: undefined,
    getRowData: getRowDataInitial

    merge: action,
    virtualTopOffset: computed,
    startIndex: computed,
    endIndex: computed,
    visibleRangeStart: computed
});

export default ListBase;