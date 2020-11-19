import BaseClass from "../BaseClass";
import FenwickTree from "models/basic/FenwickTree";
import throttle from "utils/throttle";

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

/*
    TODO:
        when estimatedRowHeight is not correct, scroll behavior is weird here
*/

class VariableHeight extends BaseClass {    

    destructor(){
        this.rowsDomObserver.disconnect();
        this.updateRowHeightsThrottled.cancel();
        super.destructor();
    }

    rowHeights = [];
    fTree = new FenwickTree();

    constructor(){
        super();

        this
            .on( this.grow, ROWS_QUANTITY )
            .on( this.updateDomObserver, ROWS_CONTAINER_NODE );
            
        this.rowsDomObserver = new MutationObserver( this.updateRowHeightsThrottled );
    }

    grow(){
        const oldLength = this.rowHeights.length;

        if( this.rowsQuantity > oldLength ){
            const oldRowHeights = this.rowHeights;
            this.rowHeights = new Uint32Array( this.rowsQuantity );
            this.rowHeights.set( oldRowHeights );
            this.rowHeights.fill( this.estimatedRowHeight, oldLength );
        }

        if( process.env.NODE_ENV !== "production" ){
            if( !this.estimatedRowHeight ){
                console.warn( "estimatedRowHeight must be provided here" );
            }
        }

        this.fTree.setN( this.rowsQuantity, this.estimatedRowHeight );

        this.setWidgetScrollHeight( this.fTree.sum( this.rowsQuantity ) );
    }

    updateDomObserver(){
        this.rowsDomObserver.disconnect();
        if( this.rowsContainerNode ){
            this.rowsDomObserver.observe( this.rowsContainerNode, { childList: true, subtree: true });
        }
    }

    updateStartIndex(){
        const v = Math.max( 0, this.fTree.find( this.scrollTop ) - this.overscanRowsCount );
        if( v !== this.startIndex ){
            this.startIndex = v;
            this.e( START_INDEX );
        }
    }

    updateEndIndex(){
        const v = Math.min( this.rowsQuantity, this.fTree.find( this.scrollTop + this.widgetHeight ) + this.overscanRowsCount );
        if( v !== this.endIndex ){
            this.endIndex = v;
            this.e( END_INDEX );
        }
    }

    updateVirtualTopOffset(){
        const v = this.fTree.sum( this.startIndex );
        if( v !== this.virtualTopOffset ){
            this.virtualTopOffset = v;
            this.e( VIRTUAL_TOP_OFFSET );
        }
    }

    setWidgetScrollHeight( v ){
        if( v !== this.widgetScrollHeight ){
            this.widgetScrollHeight = v;
            this.e( WIDGET_SCROLL_HEIGHT );
        }
        return this;
    }

    updateRowHeights(){
        const node = this.rowsContainerNode;

        if( node ){
            
            let index = this.renderedStartIndex,
                height,
                diff,
                totalDiff = 0,
                cacheChanged = false;

            for( let child of node.children ){
     
                height = child.offsetHeight;
                diff = height - this.rowHeights[ index ];

                if( diff ){
                    this.rowHeights[ index ] = height;
                    this.fTree.update( index, diff );
                    totalDiff += diff;
                    if( !cacheChanged ){
                        cacheChanged = true;
                    }
                }
                
                index++;
            }

            if( cacheChanged ){
                this
                    .startBatch()
                    .e( CACHED_ROWS_HEIGHT )
                    .setWidgetScrollHeight( this.widgetScrollHeight + totalDiff )
                    .endBatch();
            }
        }
    }

    updateRowHeightsThrottled = throttle( this.updateRowHeights, 200, this );
}

export default VariableHeight;