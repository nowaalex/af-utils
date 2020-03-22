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
                this.set( "estimatedRowHeight", node.firstElementChild.offsetHeight );
            }
        }
    }

    updateStartOffset(){
        const { scrollTop, estimatedRowHeight } = this;
        const newVisibleStartIndex = scrollTop / estimatedRowHeight | 0;
        const remainder = scrollTop % estimatedRowHeight;
        const newStartIndex = Math.max( 0, newVisibleStartIndex - this.overscanRowsCount );
        const overscanOffset = ( newVisibleStartIndex - newStartIndex ) * estimatedRowHeight;
                
        return this
            .set( "virtualTopOffset", scrollTop - remainder - overscanOffset )
            .set( "startIndex", newStartIndex );
    }

    updateEndIndex(){
        const newVisibleEndIndex = Math.ceil(( this.scrollTop + this.widgetHeight ) / this.estimatedRowHeight );
        const newEndIndex = Math.min( newVisibleEndIndex + this.overscanRowsCount, this.totalRows );
        return this.set( "endIndex", newEndIndex );
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