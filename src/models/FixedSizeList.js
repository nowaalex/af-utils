import ListBase from "./ListBase";

class FixedSizeList extends ListBase {
    
    updateWidgetScrollHeight(){
        return this.set( "widgetScrollHeight", this.estimatedRowHeight * this.totalRows );
    }

    updateEstimatedRowHeight(){
        const node = this.rowsContainerNode;

        if( node ){
            const { firstElementChild } = node;
            if( firstElementChild ){
                this.set( "estimatedRowHeight", firstElementChild.offsetHeight );
            }
        }
    }

    getVisibleRangeStart( distance ){
        const { estimatedRowHeight } = this;
        return estimatedRowHeight ? [ distance / estimatedRowHeight | 0, distance % estimatedRowHeight ] : [ 0, 0 ];
    }

    constructor(){
        super();

        this
            .on( "#estimatedRowHeight", this.updateWidgetScrollHeight )
            .on( "#widgetWidth", this.updateEstimatedRowHeight );
    }

    getDistanceBetweenIndexes( startIndex, endIndex ){
        return this.estimatedRowHeight * ( endIndex - startIndex );
    }
};

export default FixedSizeList;