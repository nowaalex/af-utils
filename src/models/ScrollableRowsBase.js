import { extendObservable, makeAutoObservable, makeObservable, action, computed } from "mobx";
import clamp from "lodash/clamp";

const getRowDataInitial = () => {
    throw new Error( "getRowData must be provided" );
}

class ScrollableRowsBase {

    get visibleRangeStart(){
        return this.getVisibleRangeStart( this.scrollTop );
    }

    get startIndex(){

        if( !this.estimatedRowHeightFinal ){
            return 0;
        }

        const [ newVisibleStartIndex ] = this.visibleRangeStart;
        return Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
    }

    get endIndex(){

        if( !this.estimatedRowHeightFinal ){
            return 0;
        }
        
        const [ newEndIndex ] = this.getVisibleRangeStart( this.scrollTop + this.widgetHeight );
        /*
            getVisibleRangeStart works by "strict less" algo. It is good for startIndex,
            but for endIndex we need "<=", so adding 1 artificially.
        */
        return Math.min( newEndIndex + 1 + this.overscanRowsCount, this.Rows.visibleRowCount );
    }

    get virtualTopOffset(){
        const [ newVisibleStartIndex, remainder ] = this.visibleRangeStart;
        const overscanOffset = this.getDistanceBetweenIndexes( this.startIndex, newVisibleStartIndex );
        return this.scrollTop - remainder - overscanOffset;
    }

    get estimatedRowHeightFinal(){
        return this.estimatedRowHeightCalculated || this.estimatedRowHeight;
    }
    
    merge( params ){
        Object.assign( this, params );
    }
    
    constructor( RowsConstructor ){
        
        makeObservable( this, {
            visibleRangeStart: computed,
            startIndex: computed,
            endIndex: computed,
            virtualTopOffset: computed,
            estimatedRowHeightFinal: computed,
            merge: action
        });

        extendObservable( this, {
            rows: [],
            overscanRowsCount: 0,
            estimatedRowHeight: 0,
            estimatedRowHeightCalculated: 0,
        
            scrollLeft: 0,
            scrollTop: 0,
        
            widgetHeight: 0,
            widgetWidth: 0,
        
            getRowKey: undefined,
            getRowData: getRowDataInitial,
        
            rowsContainerNode: null,
            scrollContainerNode: null
        });

        this.Rows = new RowsConstructor( this );
    }

    
    destructor(){}

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