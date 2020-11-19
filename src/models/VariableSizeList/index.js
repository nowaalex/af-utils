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
*/

class VariableSizeList extends ListBase {    

    destructor(){
        this.rowsDomObserver.disconnect();
        this.updateRowHeightsThrottled.cancel();
        super.destructor();
    }

    rowHeights = [];

    /*
        Fenwick tree
        TODO:
            try to find O(N) initialization algorithm instead of O(NlogN)
    */
    fTree = [];
    

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

        const oldCache = this.fTree;
        const oldCacheLen = oldCache.length;
    
        if( this.rowsQuantity + 1 > oldCacheLen ){
            this.fTree = new Uint32Array( this.rowsQuantity + 1 );
            this.fTree.set( oldCache );

            if( process.env.NODE_ENV !== "production" ){
                if( !this.estimatedRowHeight ){
                    console.warn( "estimatedRowHeight must be provided here" );
                }
            }

            for( let j = oldCacheLen; j < this.rowsQuantity; j++ ){
                this.update( j, this.estimatedRowHeight );
            }
        }

        this.setWidgetScrollHeight( this.getOffset( this.rowsQuantity ) );
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

        for( let l = 31 - Math.clz32( this.rowsQuantity ), nk; l >= 0; l-- ){
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
            this.e( WIDGET_SCROLL_HEIGHT );
        }
        return this;
    }

    update( i, delta ){
        for ( i++; i <= this.rowsQuantity; i += i & -i ){
            this.fTree[ i ] += delta;
        }
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
                    this.update( index, diff );
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

export default VariableSizeList;