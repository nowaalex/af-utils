import BaseClass from "../BaseClass";

class FixedHeight extends BaseClass {

    constructor( initialValues ){
        super();

        this.rowHeight = this.estimatedRowHeight;

        this
            .on( this.updateRowHeight, "widgetWidth", "widgetHeight", "rowsContainerNode", "rowsQuantity" )
            .on( this.updateStartIndex, "scrollTop", "rowHeight", "overscanRowsCount" )
            .on( this.updateEndIndex, "scrollTop", "widgetHeight", "rowHeight", "overscanRowsCount", "rowsQuantity" )
            .on( this.updateWidgetScrollHeight, "rowHeight", "rowsQuantity" )
            .on( this.updateVirtualTopOffset, "startIndex", "rowHeight" )
            .merge( initialValues );        
    }

    updateStartIndex(){
        this.set( "startIndex", Math.max( 0, Math.trunc( this.scrollTop / this.rowHeight ) - this.overscanRowsCount ) );
    }

    updateEndIndex(){
        this.set( "endIndex", Math.min( this.rowsQuantity, Math.trunc( ( this.scrollTop + this.widgetHeight ) / this.rowHeight ) + this.overscanRowsCount ) );
    }

    updateWidgetScrollHeight(){
        this.set( "widgetScrollHeight", this.rowHeight * this.rowsQuantity );
    }

    updateVirtualTopOffset(){
        this.set( "virtualTopOffset", this.startIndex * this.rowHeight );
    }

    updateRowHeight(){
        if( this.widgetWidth && this.widgetHeight && this.rowsContainerNode && this.rowsQuantity ){
            const { firstElementChild } = this.rowsContainerNode;
            if( firstElementChild ){
                this.set( "rowHeight", firstElementChild.offsetHeight );
            }
        }
    }
}

export default FixedHeight;