import BaseClass from "../BaseClass";
import FenwickTree from "models/basic/FenwickTree";
import throttle from "utils/throttle";

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

    constructor( initialValues ){
        super();

        /*
            Tree must be initialized after super() and before all listeners.
            Otherwise we could not get defaultInitialValue at right time.
        */
        this.fTree = new FenwickTree( initialValues && initialValues.estimatedRowHeight || this.estimatedRowHeight );

        this
            .on( this.grow, "rowsQuantity" )
            .on( this.updateDomObserver, "rowsContainerNode" )
            .on( this.updateStartIndex, "scrollTop", "overscanRowsCount", "::cache-changed" )
            .on( this.updateEndIndex, "rowsQuantity", "scrollTop", "widgetHeight", "overscanRowsCount", "::cache-changed" )
            .on( this.updateVirtualTopOffset, "startIndex", "::cache-changed" )
            .merge( initialValues );
        
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

        this.fTree.setN( this.rowsQuantity );
        this.set( "widgetScrollHeight", this.fTree.sum( this.rowsQuantity ) );
    }

    updateDomObserver(){
        this.rowsDomObserver.disconnect();
        if( this.rowsContainerNode ){
            this.rowsDomObserver.observe( this.rowsContainerNode, { childList: true, subtree: true });
        }
    }

    updateStartIndex(){
        this.set( "startIndex", Math.max( 0, this.fTree.find( this.scrollTop ) - this.overscanRowsCount ) );
    }

    updateEndIndex(){
        this.set( "endIndex", Math.min( this.rowsQuantity, this.fTree.find( this.scrollTop + this.widgetHeight ) + this.overscanRowsCount ) );
    }

    updateVirtualTopOffset(){
        this.set( "virtualTopOffset", this.fTree.sum( this.startIndex ) );
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
                    .emit( "::cache-changed" )
                    .set( "widgetScrollHeight", this.widgetScrollHeight + totalDiff )
                    .endBatch();
            }
        }
    }

    updateRowHeightsThrottled = throttle( this.updateRowHeights, 200, this );
}

export default VariableHeight;