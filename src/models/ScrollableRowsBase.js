import { extendObservable, computed, action, observable } from "mobx";
import clamp from "lodash/clamp";

const getRowDataInitial = () => {
    throw new Error( "getRowData must be provided" );
}

const BASIC_OBSERVABLE_FIELDS = {
    rows: { length: 0 },
    overscanRowsCount: 0,
    estimatedRowHeightFallback: 0,

    scrollLeft: 0,
    scrollTop: 0,

    widgetHeight: 0,
    widgetWidth: 0,

    getRowKey: undefined,
    getRowData: getRowDataInitial,

    rowsContainerNode: null,
    scrollContainerNode: null
};

const END_INDEX_CHECK_INTERVAL = 400;

class ScrollableRowsBase {

    @computed get visibleRangeStart(){
        return this.getVisibleRangeStart( this.scrollTop );
    }

    @computed get startIndex(){

        if( !this.estimatedRowHeight ){
            return 0;
        }

        const [ newVisibleStartIndex ] = this.visibleRangeStart;
        return Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
    }

    @computed get endIndex(){

        if( !this.estimatedRowHeight ){
            return 0;
        }
        
        const [ newEndIndex ] = this.getVisibleRangeStart( this.scrollTop + this.widgetHeight );

        /*
            getVisibleRangeStart works by "strict less" algo. It is good for startIndex,
            but for endIndex we need "<=", so adding 1 artificially.
        */
        return Math.min( newEndIndex + 1 + this.overscanRowsCount, this.Rows.visibleRowCount );
    }

    @computed get virtualTopOffset(){
        const [ newVisibleStartIndex, remainder ] = this.visibleRangeStart;
        const overscanOffset = this.getDistanceBetweenIndexes( this.startIndex, newVisibleStartIndex );
        return this.scrollTop - remainder - overscanOffset;
    }
    
    @action
    merge( params ){
        Object.assign( this, params );
    }
    
    constructor( RowsConstructor ){
        
        this.Rows = new RowsConstructor( this );

        extendObservable( this, BASIC_OBSERVABLE_FIELDS, {
            rowsContainerNode: observable.ref,
            scrollContainerNode: observable.ref
        });
        /*
        this
            .on( "#widgetScrollHeight", this.increaseEndIndexIfNeeded )
            .on( "#endIndex", this.increaseEndIndexIfNeeded.cancel );
        */
    }

    

    /*
        Column heights may change during scroll/width-change
    */
 
 /*   increaseEndIndexIfNeededSync(){
        const currentVisibleDist = this.getDistanceBetweenIndexes( this.startIndex, this.endIndex );
        if( this.widgetHeight > this.virtualTopOffset + currentVisibleDist - this.scrollTop ){
            this.updateEndIndex();
        }
    }

    increaseEndIndexIfNeeded = debounce( this.increaseEndIndexIfNeededSync, END_INDEX_CHECK_INTERVAL );
*/
    destructor(){
       // this.increaseEndIndexIfNeeded.cancel();
    }

    scrollToRow( index ){
        const node = this.scrollContainerNode;
        if( node ){
            node.scrollTop = this.getDistanceBetweenIndexes( 0, clamp( index, 0, this.Rows.visibleRowCount ) );
        }
        return this;    
    }

    scrollToStart(){
        return this.scrollToRow( 0 );
    }
};

export default ScrollableRowsBase;