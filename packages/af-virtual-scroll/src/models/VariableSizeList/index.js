import ListBase from "../ListBase";

import {
    EVT_START_INDEX,
    EVT_END_INDEX,
} from "constants/events";

class VariableSizeList extends ListBase {
    
    _rowHeights = [];
    _fTree = [];

    /*
        most significant bit of this.rowsQuantity;
        caching it to avoid Math.clz32 calculations on every getIndex call
    */
    _msb = 0;
    
    constructor(){
        super();

        this.on( this._measureRowsThrottled, EVT_START_INDEX, EVT_END_INDEX );            
    }

    _rowsQuantityChanged(){

        const { rowsQuantity } = this;

        if( rowsQuantity < 0 || rowsQuantity > 0x7fffffff ){
            throw new Error( `Wrong rowsQuantity: ${rowsQuantity}. Must be 0...2_147_483_647.` )
        }

        this._msb = rowsQuantity && 1 << 31 - Math.clz32( rowsQuantity );

        const curRowHeighsLength = this._rowHeights.length;

        if( rowsQuantity > curRowHeighsLength ){

            const oldRowHeights = this._rowHeights;
            
            this._rowHeights = new Uint32Array( rowsQuantity );
            this._fTree = new Uint32Array( rowsQuantity + 1 );

            this._rowHeights.set( oldRowHeights );
            this._rowHeights.fill( this._estimatedRowHeight, curRowHeighsLength );


            /* 
                Creating fenwick tree from an array in linear time;
                It is much more efficient, than calling updateRowHeight N times.
            */

            this._fTree.set( this._rowHeights, 1 );

            let widgetScrollHeight = 0;

            /* TODO: optimize <= */
            for( let i = 1, j; i <= rowsQuantity; i++ ){
                widgetScrollHeight += this._rowHeights[ i - 1 ];
                j = i + ( i & -i );
                if( j <= rowsQuantity ){
                    this._fTree[ j ] += this._fTree[ i ];
                }
            }

            this._setWidgetScrollHeight( widgetScrollHeight );
        }        
    }

    getIndex( offset ){
        let index = 0;
        
        for( let bitMask = this._msb, tempIndex; bitMask !== 0; bitMask >>= 1 ){
            tempIndex = index + bitMask;
            if( tempIndex > this.rowsQuantity ){
                continue;
            }
            if( offset === this._fTree[ tempIndex ] ){
                return tempIndex;
            }
            if( offset > this._fTree[ tempIndex ] ) {
                offset -= this._fTree[ tempIndex ];
                index = tempIndex;
            }
        }

        return index;
    }

    getOffset( index ){
        if( process.env.NODE_ENV !== "production" ){
            if( index > this.rowsQuantity ){
                throw new Error( "index must not be > rowsQuantity" );
            }
        }

        let result = 0;

        for ( ; index > 0; index -= index & -index ){
            result += this._fTree[ index ];
        }

        return result;
    }

    /* i starts from 1 here; */
    _updateRowHeight( i, delta, limitTreeLiftingIndex ){
        for ( ; i < limitTreeLiftingIndex; i += i & -i ){
            this._fTree[ i ] += delta;
        }
    }

    _measureRows(){
        let child = this._spacerNode?.nextElementSibling;

        if( child ){

            let index = this.startIndex,
                diff,
                buff = 0;
            
            /* We can batch-update fenwick tree, if we know, that all indexes are updated in +1 - order. */
            const lim = Math.min( this._fTree.length, 1 << 32 - Math.clz32( this.endIndex - 1 ) );

            do {
                diff = child.offsetHeight - this._rowHeights[ index ];

                if( diff ){
                    this._rowHeights[ index ] += diff;
                    buff += diff;
                    this._updateRowHeight( index + 1, diff, lim );                  
                }                
            }
            while( ++index < this.endIndex && ( child = child.nextElementSibling ) );

            if( buff !== 0 ){
                this._updateRowHeight( lim, buff, this._fTree.length );
                this._setWidgetScrollHeight( this.widgetScrollHeight + buff );

                /*
                    It is useless to do _updateVisibleRange here,
                    because startIndex cannot change.
                */
                this._updateEndIndex();
            }
        }
    }
}

export default VariableSizeList;