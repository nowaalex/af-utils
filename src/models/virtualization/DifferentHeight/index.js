import BaseClass from "../BaseClass";
import FenwickTree from "models/basic/FenwickTree";
import throttle from "utils/throttle";

class DifferentHeight extends BaseClass {    

    destructor(){
        this.rowsDomObserver.disconnect();
        this.updateRowHeightsThrottled.cancel();
        super.destructor();
    }

    constructor( initialValues ){
        super();

        /*
            Tree must be initialized after super() and before all listeners.
            Otherwise we could not get defaultInitialValue at right time.
        */
        this.fTree = new FenwickTree( initialValues && initialValues.estimatedRowHeight || this.estimatedRowHeight );

        this
            .addListeners( this.growTree, "rowsQuantity" )
            .addListeners( this.updateDomObserver, "rowsContainerNode" )
            .addListeners( this.updateStartIndex, "rowsQuantity", "scrollTop", "overscanRowsCount" )
            .addListeners( this.updateEndIndex, "rowsQuantity", "scrollTop", "widgetHeight", "overscanRowsCount" )
            .addListeners( this.updateWidgetScrollHeight, "scrollTop", "rowsQuantity" )
            .addListeners( this.updateVirtualTopOffset, "startIndex", "rowsQuantity" )
            .merge( initialValues );
        
        this.rowsDomObserver = new MutationObserver( this.updateRowHeightsThrottled );
    }

    growTree(){
        this.fTree.growIfNeeded( this.rowsQuantity );
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
            
            let index;

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

                this.fTree.set( index, child.offsetHeight );
            }
        }
    }

    updateRowHeightsThrottled = throttle( this.updateRowHeights, 200, this );
}

export default DifferentHeight;