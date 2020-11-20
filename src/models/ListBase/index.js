import PubSub from "../PubSub";

import {
    START_INDEX,
    END_INDEX,
    SCROLL_TOP,
    ROWS_QUANTITY,
    OVERSCAN_ROWS_COUNT,
    WIDGET_WIDTH,
    WIDGET_HEIGHT,
    VIRTUAL_TOP_OFFSET,
    WIDGET_SCROLL_HEIGHT,
    ROWS_CONTAINER_NODE,
    CACHED_ROWS_HEIGHT,
} from "constants/events";

class ListBase extends PubSub {

    /* Provided from renderer */
    scrollTop = 0;
    rowsQuantity = 0;
    overscanRowsCount = 0;
    widgetHeight = 0;
    widgetWidth = 0;
    estimatedRowHeight = 0;
    rowsContainerNode = null;
    scrollContainerNode = null;

    setScrollContainerNode( node ){
        this.scrollContainerNode = node;
    }

    setScrollTop( v ){
        if( v !== this.scrollTop ){
            this.scrollTop = v;
            this.emit( SCROLL_TOP );
        }
    }

    constructor(){
        super()

        this
            .on( this.updateStartIndex, SCROLL_TOP, CACHED_ROWS_HEIGHT, OVERSCAN_ROWS_COUNT )
            .on( this.updateEndIndex, ROWS_QUANTITY, SCROLL_TOP, WIDGET_HEIGHT, OVERSCAN_ROWS_COUNT, CACHED_ROWS_HEIGHT )
            .on( this.updateVirtualTopOffset, START_INDEX, CACHED_ROWS_HEIGHT );
    }

    scrollToRow( rowIndex ){
        if( this.scrollContainerNode ){
            this.scrollContainerNode.scrollTop = this.getOffset( rowIndex );
        }
        else if( process.env.NODE_ENV !== "production" ){
            console.error( "scrollContainerNode is not set" );
        }
    }

    updateStartIndex(){
        const v = Math.max( 0, this.getIndex( this.scrollTop ) - this.overscanRowsCount );
        if( v !== this.startIndex ){
            this.startIndex = v;
            this.emit( START_INDEX );
        }
    }

    updateEndIndex(){
        const v = Math.min( this.rowsQuantity, this.getIndex( this.scrollTop + this.widgetHeight ) + this.overscanRowsCount );
        if( v !== this.endIndex ){
            this.endIndex = v;
            this.emit( END_INDEX );
        }
    }

    updateVirtualTopOffset(){
        const v = this.getOffset( this.startIndex );
        if( v !== this.virtualTopOffset ){
            this.virtualTopOffset = v;
            this.emit( VIRTUAL_TOP_OFFSET );
        }
    }

    setWidgetDimensions( width, height ){
        this.startBatch();
        if( width !== this.widgetWidth ){
            this.widgetWidth = width;
            this.emit( WIDGET_WIDTH );
        }
        if( height !== this.widgetHeight ){
            this.widgetHeight = height;
            this.emit( WIDGET_HEIGHT );
        }
        this.endBatch();
    }

    setViewParams( estimatedRowHeight, overscanRowsCount, rowsQuantity, rowsContainerNode ){

        this.estimatedRowHeight = estimatedRowHeight;

        this.startBatch();

        if( overscanRowsCount !== this.overscanRowsCount ){
            this.overscanRowsCount = overscanRowsCount;
            this.emit( OVERSCAN_ROWS_COUNT );
        }

        if( rowsQuantity !== this.rowsQuantity ){
            this.rowsQuantity = rowsQuantity;
            this.emit( ROWS_QUANTITY );
        }

        if( rowsContainerNode !== this.rowsContainerNode ){
            this.rowsContainerNode = rowsContainerNode;
            this.emit( ROWS_CONTAINER_NODE );
        }

        this.endBatch();
    }

    /* Calculated inside model */
    startIndex = 0;
    endIndex = 0;
    virtualTopOffset = 0;
    widgetScrollHeight = 0;
}

export default ListBase;