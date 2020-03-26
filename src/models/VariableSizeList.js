import ListBase from "./ListBase";
import debounce from "lodash/debounce";

// Uint16 cannot be used here, because array stores intermediate sums, which can be huge.
const SegmentsTreeCache = Uint32Array;

/*
    This constant is used for 2 reasons:
        * Math.log2( 1 ) is 0, which is not correct for cache size calculation
        * We should always have some extra space for new rows. We do not want to reallocate cache every time.
*/
const MIN_TREE_CACHE_SIZE = 32;

const ROW_MEASUREMENT_DEBOUNCE_INTERVAL = 50;
const ROW_MEASUREMENT_DEBOUNCE_MAXWAIT = 150;

/*
    Could just make [ 0, 0 ], but want to keep type of heightsCache always of same type.
*/
const DEFAULT_HEIGHS_CACHE = new SegmentsTreeCache( 2 );

class VariableSizeList extends ListBase {

    /* Two vars for non-recursive segments tree */
    sTree = DEFAULT_HEIGHS_CACHE;
    N = 0;

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
        return this.set( "widgetScrollHeight", this.sTree[ 1 ] );
    }

    calculateParentsInRange( startIndex, endIndex ){
        const { sTree, N } = this;
    
        for( endIndex += N, startIndex += N; endIndex >>= 1; ){
            for( let i = startIndex >>= 1; i <= endIndex; i++ ){
                sTree[ i ] = sTree[ i << 1 ] + sTree[ i << 1 | 1 ];
            }
        }

        return this;
    }

    /*
        TODO: maybe some react-like performUnitOfWork logic is needed here?
    */
    setVisibleRowsHeights = debounce(() => {
        const node = this.rowsContainerNode;

        if( node ){
            const { sTree, N } = this;
            
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

                if( sTree[ N + index ] !== newHeight ){
                    // console.log( "%d| was: %d; is: %d", index, sTree[N+index],newHeight)
                    sTree[ N + index ] = newHeight;
                    
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
                    this
                        .calculateParentsInRange( l, r )
                        .updateWidgetScrollHeight();
                }
            }
        }

        return this;
    }, ROW_MEASUREMENT_DEBOUNCE_INTERVAL, { maxWait: ROW_MEASUREMENT_DEBOUNCE_MAXWAIT });
    
    getVisibleRangeStart( dist ){
        const { sTree, N } = this;
        let nodeIndex = 1, v;

        while( nodeIndex < N ){
            v = sTree[ nodeIndex <<= 1 ];
            if( dist >= v ){
                dist -= v;
                nodeIndex |= 1;
            }
        }

        return [ nodeIndex - N, dist ];
    }

    resetMeasurementsCache(){
        const { totalRows } = this;

        if( totalRows ){

            const { estimatedRowHeight } = this;
            let { sTree, N } = this;

            if( totalRows > N ){
                N = this.N = 2 ** Math.ceil( Math.log2( totalRows + MIN_TREE_CACHE_SIZE ) );
                sTree = this.sTree = new SegmentsTreeCache( N * 2 );
            }
            else{
                const [ prevTotalRows ] = sTree;
    
                /*
                    clearing only what is needed;
                    TODO: optimize this more
                */
                if( totalRows !== prevTotalRows ){
                    sTree.fill( 0, 2, N + Math.max( totalRows, prevTotalRows ) >> 1 )
                }
            }

            sTree.fill( estimatedRowHeight, N, N + totalRows );

            /*
                Trees are not always ideally allocated, gaps are possible.
                Classical way for calculating parents is much simpler,
                but can do much more work(summing zeros) in such conditions. Commented classic algo:
        
                for( let i = N + totalRows >> 1, j; i > 0; --i ){
                    j = i << 1;
                    sTree[ i ] = sTree[ j ] + sTree[ j | 1 ];
                }
            */
            this.calculateParentsInRange( 0, totalRows );
        }
        else{
            this.sTree = DEFAULT_HEIGHS_CACHE;
        }

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
        const { sTree, N } = this;
        let res = 0; 

        for( startIndex += N, endIndex += N; startIndex < endIndex; startIndex >>= 1, endIndex >>= 1 ){
            if( startIndex & 1 ){
                res += sTree[ startIndex++ ];
            }

            if( endIndex & 1 ){
                res += sTree[ --endIndex ]; 
            }
        };

        return res; 
    }
};

export default VariableSizeList;