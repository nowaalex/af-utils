import { computed, autorun, runInAction, makeObservable } from "mobx";
import ScrollableRowsBase from "./ScrollableRowsBase";

class FixedSizeScrollableRows extends ScrollableRowsBase {

    constructor( RowsConstructor ){
        super( RowsConstructor );

        makeObservable( this, {
            widgetScrollHeight: computed
        });

        this.dispose = autorun(() => {
            if( this.widgetWidth ){
                const node = this.rowsContainerNode;
    
                if( node ){
                    const { firstElementChild } = node;
                    if( firstElementChild ){
                        runInAction(() => {
                            this.estimatedRowHeightCalculated = firstElementChild.offsetHeight;
                        })
                    }
                }
            }
        }, { delay: 200 });
    }

    desctructor(){
        this.dispose();
        super.destructor();
    }

    get widgetScrollHeight(){
        return this.estimatedRowHeightFinal * this.Rows.visibleRowCount;
    }

    getVisibleRangeStart( distance ){
        const { estimatedRowHeightFinal } = this;
        return estimatedRowHeightFinal ? [ distance / estimatedRowHeightFinal | 0, distance % estimatedRowHeightFinal ] : [ 0, 0 ];
    }

    getDistanceBetweenIndexes( startIndex, endIndex ){
        return this.estimatedRowHeightFinal * ( endIndex - startIndex );
    }
};

export default FixedSizeScrollableRows;