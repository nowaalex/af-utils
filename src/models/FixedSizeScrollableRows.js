import { computed, autorun } from "mobx";
import ScrollableRowsBase from "./ScrollableRowsBase";

class FixedSizeScrollableRows extends ScrollableRowsBase {

    constructor( RowsConstructor ){
        super( RowsConstructor );

        this.dispose = autorun(() => {
            if( this.widgetWidth ){
                const node = this.rowsContainerNode;
    
                if( node ){
                    const { firstElementChild } = node;
                    if( firstElementChild ){
                        this.estimatedRowHeight = firstElementChild.offsetHeight;
                    }
                }
            }
        }, { delay: 200 });
    }

    desctructor(){
        this.dispose();
        super.destructor();
    }

    @computed get widgetScrollHeight(){
        return this.estimatedRowHeight * this.Rows.visibleRowCount;
    }

    getVisibleRangeStart( distance ){
        const { estimatedRowHeight } = this;
        return estimatedRowHeight ? [ distance / estimatedRowHeight | 0, distance % estimatedRowHeight ] : [ 0, 0 ];
    }

    getDistanceBetweenIndexes( startIndex, endIndex ){
        return this.estimatedRowHeight * ( endIndex - startIndex );
    }
};

export default FixedSizeScrollableRows;