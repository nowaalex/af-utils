import { computed } from "mobx";
import ScrollableRowsBase from "./ScrollableRowsBase";

class FixedSizeScrollableRows extends ScrollableRowsBase {

    @computed get estimatedRowHeight(){
        if( this.widgetWidth ){
            const node = this.rowsContainerNode;

            if( node ){
                const { firstElementChild } = node;
                if( firstElementChild ){
                    return firstElementChild.offsetHeight;
                }
            }
        }
        return this.estimatedRowHeightFallback;
    }

    set estimatedRowHeight( value ){
        this.estimatedRowHeightFallback = value;
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