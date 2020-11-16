import BaseClass from "../BaseClass";
import FenwickTree from "models/basic/FenwickTree";
import throttle from "utils/throttle";

class DifferentHeight extends BaseClass {    

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
            .addListeners( this.grow, "rowsQuantity" )
            .addListeners( this.updateDomObserver, "rowsContainerNode" )
            .addListeners( this.updateStartIndex, "scrollTop", "overscanRowsCount", "::cache-changed" )
            .addListeners( this.updateEndIndex, "rowsQuantity", "scrollTop", "widgetHeight", "overscanRowsCount", "::cache-changed" )
            .addListeners( this.updateWidgetScrollHeight, "::cache-changed" )
            .addListeners( this.updateVirtualTopOffset, "startIndex", "::cache-changed" )
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
            this.fTree.grow( this.rowsQuantity );
        }
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

    updateWidgetScrollHeight(){
        this.set( "widgetScrollHeight", this.fTree.total );
    }

    updateVirtualTopOffset(){
        this.set( "virtualTopOffset", this.fTree.sum( this.startIndex ) );
    }

    updateRowHeights(){
        const node = this.rowsContainerNode;


        if( node ){
            
            let index, height, diff, cacheChanged = false;

            for( let child of node.children ){
                
                /*
                    * aria-rowindex is counted from 1 according to w3c spec;
                    * parseInt with radix is 2x faster, then +, -, etc.
                        https://jsperf.com/number-vs-parseint-vs-plus/116
                */
                index = Number.parseInt( child.getAttribute( "aria-rowindex" ), 10 ) - 1;
                
                if( process.env.NODE_ENV !== "production" && Number.isNaN( index ) ){
                    throw new Error( "aria-rowindex attribute must be present on each row. Look at default Row implementations." );
                }

                height = child.offsetHeight;
                diff = height - this.rowHeights[ index ];

                if( diff ){
                    this.rowHeights[ index ] = height;
                    this.fTree.update( index, diff );
                    if( !cacheChanged ){
                        cacheChanged = true;
                    }
                }                
            }

            if( cacheChanged ){
                this.emit( "::cache-changed" );
            }
        }
    }

    updateRowHeightsThrottled = throttle( this.updateRowHeights, 200, this );
}

export default DifferentHeight;