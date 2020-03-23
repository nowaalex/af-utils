import ListBase from "./ListBase";
import debounce from "lodash/debounce";

import {
    calculateParentsInRange,
    walkUntil,
    sum,
    reallocateIfNeeded
} from "../utils/tree";

const ROW_MEASUREMENT_DEBOUNCE_INTERVAL = 50;
const ROW_MEASUREMENT_DEBOUNCE_MAXWAIT = 150;

/*
    Could just make [ 0, 0 ], but want to keep type of heightsCache always of same type.
*/
const DEFAULT_HEIGHS_CACHE = new Uint32Array( 2 );

class VariableSizeList extends ListBase {

    heighsCache = DEFAULT_HEIGHS_CACHE;

    /*
        When all row heights are different,
        we must "predict" them on the left of startIndex and on the right of endIndex(where they are invisible),
        basing on what we know: heights between startIndex and endIndex.
        Using simple average by default.
    */
    shouldResetInvisibleRowHeights = true;

    markResetInvisibleRowHeights(){
        this.shouldResetInvisibleRowHeights = true;
    }

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
                see utils/tree.
            */
            const tree = this.heighsCache,
                N = tree.length >> 1;
            
            let l = -1,
                r = -1,
                rowHeightsSum = 0,
                rowCounter = 0;

            /*
                Some benchmarks inspire me to use nextElementSibling
                https://jsperf.com/nextsibling-vs-childnodes-increment/2
            */
            for( let child = node.firstElementChild, newHeight, index; child; child = child.nextElementSibling, rowCounter++ ){
                
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
                rowHeightsSum += newHeight;

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

                if( this.shouldResetInvisibleRowHeights ){
                    this.set( "estimatedRowHeight", Math.round( rowHeightsSum / rowCounter ) );
                    this.shouldResetInvisibleRowHeights = false;
                }
                else{
                    calculateParentsInRange( l, r, tree );
                    this.updateWidgetScrollHeight();
                }
            }
        }

        return this;
    }, ROW_MEASUREMENT_DEBOUNCE_INTERVAL, { maxWait: ROW_MEASUREMENT_DEBOUNCE_MAXWAIT });
    
    updateStartOffset(){
        const { scrollTop, heighsCache, overscanRowsCount } = this;
        const [ newVisibleStartIndex, remainder ] = walkUntil( scrollTop, heighsCache );
        const newStartIndex = Math.max( 0, newVisibleStartIndex - overscanRowsCount );
        const overscanOffset = sum( newStartIndex, newVisibleStartIndex, heighsCache );
                
        return this
            .set( "virtualTopOffset", scrollTop - remainder - overscanOffset )
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
        this.heighsCache = this.totalRows ? reallocateIfNeeded( this.heighsCache, this.totalRows, this.estimatedRowHeight ) : DEFAULT_HEIGHS_CACHE;
        return this;
    }

    constructor(){
        super();

        this
            .prependListener( "#totalRows", this.resetMeasurementsCache )
            .on( "#estimatedRowHeight", this.resetMeasurementsCache )
            .on( "#estimatedRowHeight", this.updateWidgetScrollHeight )
            .on( "rows-rendered", this.setVisibleRowsHeights )
            .on( "#widgetWidth", this.markResetInvisibleRowHeights )
            .on( "#widgetWidth", this.setVisibleRowsHeights );
    }

    destructor(){
        this.setVisibleRowsHeights.cancel();
        super.destructor();
    }

    getDistanceBetweenIndexes( startIndex, endIndex ){
        return sum( startIndex, endIndex, this.heighsCache );
    }
};

export default VariableSizeList;