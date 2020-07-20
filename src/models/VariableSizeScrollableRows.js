import ScrollableRowsBase from "./ScrollableRowsBase";
import SegmentsTree from "./SegmentsTree";
import { extendObservable, autorun, action, runInAction } from "mobx";

const ROW_MEASUREMENT_DEBOUNCE_INTERVAL = 200;

class VariableSizeScrollableRows extends ScrollableRowsBase {

    rowsDomObserver = new MutationObserver(() => runInAction(() => {
        this.lastRowsRenderTimeStamp = performance.now();
    }));

    disposeCallbacks = [];

    sTree = new SegmentsTree();

    @action
    syncWidgetScrollHeight(){
        this.widgetScrollHeight = this.sTree.total;
    }
   
    getVisibleRangeStart( dist ){

        const { widgetScrollHeight, estimatedRowHeight, sTree } = this;

        if( widgetScrollHeight && estimatedRowHeight ){
            return sTree.getStartPositionForSum( dist );
        }
        
        return [ 0, 0 ];
    }

    constructor( RowsConstructor ){
        super( RowsConstructor );

        extendObservable( this, {
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
                this.sTree.reallocateIfNeeded( this.rows.length, this.estimatedRowHeight );
                this.syncWidgetScrollHeight();
            }),
            autorun(() => {
                if( this.widgetWidth ){
                    this.merge({
                        shouldResetInvisibleRowHeights: true
                    });
                }
            }, { delay: 200 }),
            autorun(() => {
                this.rowsDomObserver.disconnect();
                if( this.rowsContainerNode ){
                    this.rowsDomObserver.observe( this.rowsContainerNode, { childList: true, subtree: true });
                }
            }),
            autorun(() => {
                const node = this.rowsContainerNode;

                if( node && this.lastRowsRenderTimeStamp ){
                    const { sTree } = this;
                    
                    let rowHeightsSum = 0,
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
                        sTree.set( index, newHeight );
                    }
    
                    if( this.shouldResetInvisibleRowHeights ){
                        this.merge({
                            estimatedRowHeight: Math.round( rowHeightsSum / rowCounter ),
                            shouldResetInvisibleRowHeights: false
                        });
                    }
                    else if( sTree.flush() ){
                        this.syncWidgetScrollHeight();
                    }
                }
            }, { delay: ROW_MEASUREMENT_DEBOUNCE_INTERVAL })
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

        return this.sTree.getDistanceBetweenIndexes( startIndex, endIndex );
    }
};

export default VariableSizeScrollableRows;