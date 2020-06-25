import { computed, decorate } from "mobx";
import ListBase from "./ListBase";

class FixedSizeList extends ListBase {

    get estimatedRowHeight(){
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

    get widgetScrollHeight(){
        return this.estimatedRowHeight * this.totalRows;
    }

    getVisibleRangeStart( distance ){
        const { estimatedRowHeight } = this;
        return estimatedRowHeight ? [ distance / estimatedRowHeight | 0, distance % estimatedRowHeight ] : [ 0, 0 ];
    }

    getDistanceBetweenIndexes( startIndex, endIndex ){
        return this.estimatedRowHeight * ( endIndex - startIndex );
    }
};

decorate( FixedSizeList, {
    estimatedRowHeight: computed({ keepAlive: true }),
    widgetScrollHeight: computed
})

export default FixedSizeList;