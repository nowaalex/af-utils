import ScrollableRowsBase from "./ScrollableRowsBase";
import SegmentsTree from "./SegmentsTree";
import { observable, autorun, makeObservable, action, runInAction } from "mobx";

const ROW_MEASUREMENT_DEBOUNCE_INTERVAL = 200;

class VariableSizeScrollableRows extends ScrollableRowsBase {

    rowsDomObserver = new MutationObserver(() => runInAction(() => {
        this.lastRowsRenderTimeStamp = performance.now();
    }));

    disposeCallbacks = [];

    sTree = new SegmentsTree();

    syncWidgetScrollHeight(){
        this.widgetScrollHeight = this.sTree.total;
    }
   
    getVisibleRangeStart( dist ){

        const { widgetScrollHeight, estimatedRowHeightFinal, sTree } = this;

        if( widgetScrollHeight && estimatedRowHeightFinal ){
            return sTree.getStartPositionForSum( dist );
        }
        
        return [ 0, 0 ];
    }

    widgetScrollHeight = 0;
    lastRowsRenderTimeStamp = 0;

    /*
        When all row heights are different,
        we must "predict" them on the left of startIndex and on the right of endIndex(where they are invisible),
        basing on what we know: heights between startIndex and endIndex.
        Using simple average by default.
    */
    shouldResetInvisibleRowHeights = true;

    constructor( RowsConstructor ){
        super( RowsConstructor );

        makeObservable( this, {
            widgetScrollHeight: observable,
            lastRowsRenderTimeStamp: observable,
            shouldResetInvisibleRowHeights: observable,
            syncWidgetScrollHeight: action
        });

        this.disposeCallbacks.push(
            autorun(() => {
                this.sTree.reallocateIfNeeded( this.rows.length && this.Rows.visibleRowCount, this.estimatedRowHeightFinal );
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
                        newHeight,
                        index;

                    for( let child of node.children ){
                        
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
                            estimatedRowHeightCalculated: Math.round( rowHeightsSum / node.children.length ),
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

        if( !this.estimatedRowHeightFinal ){
            return 0;
        }

        return this.sTree.getDistanceBetweenIndexes( startIndex, endIndex );
    }
};

export default VariableSizeScrollableRows;