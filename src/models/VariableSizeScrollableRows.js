import ScrollableRowsBase from "./ScrollableRowsBase";
import { observable, extendObservable, computed, autorun, action, runInAction, reaction } from "mobx";

/*
    We should always have some extra space for new rows. We do not want to reallocate cache every time.
*/
const MIN_TREE_CACHE_OFFSET = 15;

const ROW_MEASUREMENT_DEBOUNCE_INTERVAL = 200;

class VariableSizeScrollableRows extends ScrollableRowsBase {

    rowsDomObserver = new MutationObserver(() => runInAction(() => {
        this.lastRowsRenderTimeStamp = performance.now();
    }));

    disposeCallbacks = [];


    @computed({ keepAlive: true }) get N(){
        /* Nearest pow of 2 to visibleRowCount. 56 >= 64, 67 => 128, etc. */
        const { visibleRowCount } = this.Rows;
        return visibleRowCount > 0 ? 2 << Math.log2( visibleRowCount + MIN_TREE_CACHE_OFFSET ) : 1;
    }

    @computed({ keepAlive: true }) get sTree(){
        // Uint16 cannot be used here, because array stores intermediate sums, which can be huge.
        if( process.env.NODE_ENV !== "production" ){
            console.log( "New tree cache. Size:", this.N );
        }
        return new Uint32Array( this.N << 1 );
    }

    calculateParentsInRange( startIndex, endIndex ){
        const { sTree, N } = this;
    
        for( endIndex += N, startIndex += N; endIndex >>= 1; ){
            for( let i = startIndex >>= 1; i <= endIndex; i++ ){
                sTree[ i ] = sTree[ i << 1 ] + sTree[ i << 1 | 1 ];
            }
        }

        /* In segments tree 1 node is always sum of all elements */
        this.merge({ widgetScrollHeight: sTree[ 1 ] });
    }
   
    getVisibleRangeStart( dist ){

        const { widgetScrollHeight, estimatedRowHeight, sTree, N } = this;

        if( widgetScrollHeight && estimatedRowHeight ){
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
        
        return [ 0, 0 ];
    }

    constructor(){
        super();

        extendObservable( this, {
            estimatedRowHeight: 0,
            widgetScrollHeight: 0,
            lastRowsRenderTimeStamp: 0,
        
            /*
                When all row heights are different,
                we must "predict" them on the left of startIndex and on the right of endIndex(where they are invisible),
                basing on what we know: heights between startIndex and endIndex.
                Using simple average by default.
            */
            shouldResetInvisibleRowHeights: true
        });

        this.disposeCallbacks.push(
            autorun(() => {
                this.estimatedRowHeight = this.estimatedRowHeightFallback;
            }),
            autorun(() => {

                const { rowCount, estimatedRowHeight } = this;

                //superdirty
                if( !estimatedRowHeight || !rowCount ){
                    return;
                }

                const { sTree, N, Rows: { visibleRowCount } } = this;
                sTree.fill( estimatedRowHeight, N, N + visibleRowCount );
                /*
                    Trees are not always ideally allocated, gaps are possible.
                    Classical way for calculating parents is much simpler,
                    but can do much more work(summing zeros) in such conditions. Commented classic algo:
            
                    for( let i = N + visibleRowCount >> 1, j; i > 0; --i ){
                        j = i << 1;
                        sTree[ i ] = sTree[ j ] + sTree[ j | 1 ];
                    }
                */
                this.calculateParentsInRange( 0, visibleRowCount );
            }),
            autorun(() => {
                if( this.widgetWidth ){
                    this.merge({
                        shouldResetInvisibleRowHeights: true
                    });
                }
            }),
            autorun(() => {
                this.rowsDomObserver.disconnect();
                if( this.rowsContainerNode ){
                    this.rowsDomObserver.observe( this.rowsContainerNode, { childList: true, subtree: true });
                }
            }),
            reaction(
                () => this.lastRowsRenderTimeStamp * this.widgetWidth,
                () => {
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
                                this.merge({
                                    estimatedRowHeight: Math.round( rowHeightsSum / rowCounter ),
                                    shouldResetInvisibleRowHeights: false
                                });
                            }
                            else{
                                this.calculateParentsInRange( l, r )
                            }
                        }
                    }
                },
                { delay: ROW_MEASUREMENT_DEBOUNCE_INTERVAL }
            )
        );
    }

    destructor(){
        this.disposeCallbacks.forEach( cb => cb() );
        super.destructor();
    }

    getDistanceBetweenIndexes( startIndex, endIndex ){

        if( !this.estimatedRowHeight ){
            return 0;
        }

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

export default VariableSizeScrollableRows;