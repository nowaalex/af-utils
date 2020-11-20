import ListBase from "../ListBase";
import throttle from "utils/throttle";

import {
    ROWS_QUANTITY,
    WIDGET_SCROLL_HEIGHT,
    ROWS_CONTAINER_NODE,
    CACHED_ROWS_HEIGHT,
} from "constants/events";

/*
    TODO:
        when estimatedRowHeight is not correct, scroll behavior is weird here
        maybe MutationObserver is not needed?
        perform resetCacheHeights from useEffect on rowRenderer change
*/

class VariableSizeList extends ListBase {
    
    rowHeights = [];
    fTree = [];

    /* just to avoid Math.clz32 calculations on every getIndex call */
    rowsQuantityClzStart = 0;
    
    constructor(){
        super();

        this
            /* must be done before events, attached in ListBase */
            .prependListener( this.grow, ROWS_QUANTITY )
            .on( this.updateDomObserver, ROWS_CONTAINER_NODE );
            
        this.rowsDomObserver = new MutationObserver( this.updateRowHeightsThrottled );
    }

    destructor(){
        this.rowsDomObserver.disconnect();
        this.updateRowHeightsThrottled.cancel();
        super.destructor();
    }

    grow(){
        const { rowsQuantity } = this;
        if( rowsQuantity > this.rowHeights.length ){
            this.rowHeights = new Uint32Array( rowsQuantity );
            this.fTree = new Uint32Array( rowsQuantity + 1 );
        }
        this.rowsQuantityClzStart = 31 - Math.clz32( rowsQuantity );
        this.resetCachedHeights();
    }

    resetCachedHeights( rowHeight = this.estimatedRowHeight ){
        this.rowHeights.fill( rowHeight );

        /* Filling FenwickTee with 1 value  */
        for ( let i = 1; i <= this.rowsQuantity; i++ ){
            this.fTree[ i ] = rowHeight * ( i & -i );
        }

        this.setWidgetScrollHeight( rowHeight * this.rowsQuantity );
    }

    updateDomObserver(){
        this.rowsDomObserver.disconnect();
        if( this.rowsContainerNode ){
            this.rowsDomObserver.observe( this.rowsContainerNode, { childList: true, subtree: true });
        }
    }

    /*
        TODO:
            there is a way to optimize this by doing l >> 1 instead of l-- and 1 << l
    */
    getIndex( offset ){
        let k = 0;

        for( let l = this.rowsQuantityClzStart, nk; l >= 0; l-- ){
            nk = k + ( 1 << l );
            if( nk > this.rowsQuantity ){
                continue;
            }
            if( offset === this.fTree[ nk ] ){
                return nk;
            }
            if( offset > this.fTree[ nk ] ) {
                k = nk;
                offset -= this.fTree[ k ];
            }
        }

        return k;
    }

    getOffset( index ){
        let result = 0;
        for ( ; index > 0; index -= index & -index ){
            result += this.fTree[ index ];
        }
        return result;
    }

    setWidgetScrollHeight( v ){
        if( v !== this.widgetScrollHeight ){
            this.widgetScrollHeight = v;
            this.emit( WIDGET_SCROLL_HEIGHT );
        }
        return this;
    }

    updateRowHeight( i, delta ){
        for ( i++; i <= this.rowsQuantity; i += i & -i ){
            this.fTree[ i ] += delta;
        }
    }

    updateRowHeights(){
        const node = this.rowsContainerNode;

        if( node ){

            let index = this.startIndex,
                height,
                diff,
                totalDiff = 0,
                cacheChanged = false;

            for( let child of node.children ){
     
                height = child.offsetHeight;
                diff = height - this.rowHeights[ index ];

                if( diff ){
                    this.rowHeights[ index ] = height;
                    this.updateRowHeight( index, diff );
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
                    .emit( CACHED_ROWS_HEIGHT )
                    .setWidgetScrollHeight( this.widgetScrollHeight + totalDiff )
                    .endBatch();
            }
        }
    }

    updateRowHeightsThrottled = throttle( this.updateRowHeights, 200, this );
}

export default VariableSizeList;