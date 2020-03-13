import FixedSizeList from "../FixedSizeList";
import debounce from "lodash/debounce";

import {
    calculateParentsInRange,
    walkUntil,
    sum,
    reallocateIfNeeded
} from "./treeUtils";

const ROW_MEASUREMENT_DEBOUNCE_INTERVAL = 50;
const ROW_MEASUREMENT_DEBOUNCE_MAXWAIT = 150;
const END_INDEX_CHECK_INTERVAL = 400;

const DEFAULT_HEIGHS_CACHE = [ 0, 0 ];

class VariableSizeList extends FixedSizeList {

    estimatedRowHeight = 0;
    heighsCache = DEFAULT_HEIGHS_CACHE;

    updateWidgetScrollHeight(){
        /* In segments tree 1 node is always sum of all elements */
        return this.set( "widgetScrollHeight", this.heighsCache[ 1 ] );
    }

    /*
        TODO: maybe some react-like performUnitOfWork logic is needed here?
    */
    setVisibleRowsHeights = debounce(() => {
        const node = this.rowsContainerNode;

        if( node ){
            
            /*
                TODO:
                    make tree[ 0 ] more obvious and self-documented
            */
            const tree = this.heighsCache,
                N = tree[ 0 ];
            
            let l = -1,
                r = -1;

            /*
                Some benchmarks inspire me to use nextElementSibling
                https://jsperf.com/nextsibling-vs-childnodes-increment/2
            */
            for( let child = node.firstElementChild, newHeight, index; child; child = child.nextElementSibling ){
                
                /*
                    * aria-rowindex is counted from 1 according to w3c spec;
                    * parseInt with radix is 2x faster, then +, -, etc.
                      https://jsperf.com/number-vs-parseint-vs-plus/116
                */
                index = parseInt( child.getAttribute( "aria-rowindex" ), 10 ) - 1;

                if( process.env.NODE_ENV !== "production" && Number.isNaN( index ) ){
                    throw new Error( "aria-rowindex attribute must be present on each row. Look at default Row implementations." );
                }

                newHeight = child.offsetHeight;
                

                if( tree[ N + index ] !== newHeight ){
                    // console.log( "%d| was: %d; is: %d", index, tree[N+index],newHeight)
                    tree[ N + index ] = newHeight;
                    
                    if( l === -1 ){
                        l = index;
                    }
                    
                    r = index;
                }
            }
 
            if( l !== -1 ){
                if( process.env.NODE_ENV !== "production" ){
                    console.log( "Updating heights in range: %d - %d", l, r );
                }
                calculateParentsInRange( l, r, tree );
                this.updateWidgetScrollHeight();
            }
        }

        return this;
    }, ROW_MEASUREMENT_DEBOUNCE_INTERVAL, { maxWait: ROW_MEASUREMENT_DEBOUNCE_MAXWAIT });

    /*
        Column heights may change during scroll/width-change,
    */
    increaseEndIndexIfNeeded = debounce(() => {
        const currentVisibleDist = sum( this.startIndex, this.endIndex, this.heighsCache );
        if( this.widgetHeight > this.virtualTopOffset + currentVisibleDist - this.scrollTop ){
            this.updateEndIndex();
        }
        return this;
    }, END_INDEX_CHECK_INTERVAL );

    refreshOffsets(){
        const newTopOffset = this.scrollTop;
        const [ newVisibleStartIndex, remainder ] = walkUntil( newTopOffset, this.heighsCache );
        const newStartIndex = Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
        const overscanOffset = sum( newStartIndex, newVisibleStartIndex, this.heighsCache );
                
        return this
            .set( "virtualTopOffset", newTopOffset - remainder - overscanOffset )
            .set( "startIndex", newStartIndex );
    }

    updateEndIndex(){
        /*
            TODO:
                perf benchmarks tell, that removeChild is called often.
                maybe cache previous range( endIndex - startIndex ) and if new range is smaller - throttle it's decrease?
        */
        const [ newEndIndex ] = walkUntil( this.scrollTop + this.widgetHeight, this.heighsCache );
        /*
            walkUntil works by "strict less" algo. It is good for startIndex,
            but for endIndex we need "<=", so adding 1 artificially.
        */
        return this.set( "endIndex", Math.min( newEndIndex + 1 + this.overscanRowsCount, this.totalRows ) );
    }

    resetMeasurementsCache(){
        if( process.env.NODE_ENV !== "production" ){
            if( !this.estimatedRowHeight ){
                throw new Error( "estimatedRowHeight must be provided" );
            }
        }
        
        this.heighsCache = this.totalRows ? reallocateIfNeeded( this.heighsCache, this.totalRows, this.estimatedRowHeight ) : DEFAULT_HEIGHS_CACHE;
        return this;
    }

    /*
    TODO: maybe this is needed on #totalRows? Check

    cancelPendingAsyncCallsIfNeeded(){
        if( this.totalRows < 0 ){
            this.cancelPendingAsyncCalls();
        }
    }
    */

    constructor(){
        super();

        this
            .prependListener( "#totalRows", this.resetMeasurementsCache )
            .on( "#widgetScrollHeight", this.increaseEndIndexIfNeeded )
            .on( "rows-rendered", this.setVisibleRowsHeights )
            .on( "#endIndex", this.increaseEndIndexIfNeeded.cancel )
            .on( "#widgetWidth", this.setVisibleRowsHeights );
    }

    destructor(){
        this.setVisibleRowsHeights.cancel();
        this.increaseEndIndexIfNeeded.cancel();
        super.destructor();
    }

    getNodeScrollTopForRowIndex( clampedRowIndex ){
        return sum( 0, clampedRowIndex, this.heighsCache );
    }
};

export default VariableSizeList;