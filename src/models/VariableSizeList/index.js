import ListBase from "../ListBase";

import {
    ROWS_QUANTITY,
    START_INDEX,
    END_INDEX,
} from "constants/events";

class VariableSizeList extends ListBase {
    
    rowHeights = [];
    fTree = [];

    /*
        most significant bit of this.rowsQuantity;
        caching it to avoid Math.clz32 calculations on every getIndex call
    */
    msb = 0;
    
    constructor(){
        super();

        this
            /* must be done before events, attached in ListBase */
            .prependListener( this.grow, ROWS_QUANTITY )
            .on( this.measureRowsThrottled, START_INDEX, END_INDEX );            
    }

    grow(){
        const { rowsQuantity } = this;

        if( rowsQuantity < 0 || rowsQuantity > 0x7fffffff ){
            throw new Error( `Wrong rowsQuantity: ${rowsQuantity}. Must be 0...2_147_483_647.` )
        }

        this.msb = rowsQuantity && 1 << 31 - Math.clz32( rowsQuantity );

        const curRowHeighsLength = this.rowHeights.length;

        if( rowsQuantity > curRowHeighsLength ){

            const oldRowHeights = this.rowHeights;
            
            this.rowHeights = new Uint32Array( rowsQuantity );
            this.fTree = new Uint32Array( rowsQuantity + 1 );

            this.rowHeights.set( oldRowHeights );
            this.rowHeights.fill( this.estimatedRowHeight, curRowHeighsLength );


            /* 
                Creating fenwick tree from an array in linear time;
                It is much more efficient, than calling updateRowHeight N times.
            */

            this.fTree.set( this.rowHeights, 1 );

            for( let i = 1, j; i <= rowsQuantity; i++ ){
                j = i + ( i & -i );
                if( j <= rowsQuantity ){
                    this.fTree[ j ] += this.fTree[ i ];
                }
            }

            this.remeasure();
        }        
    }

    getIndex( offset ){
        let index = 0;
        
        for( let bitMask = this.msb, tempIndex; bitMask !== 0; bitMask >>= 1 ){
            tempIndex = index + bitMask;
            if( tempIndex > this.rowsQuantity ){
                continue;
            }
            if( offset === this.fTree[ tempIndex ] ){
                return tempIndex;
            }
            if( offset > this.fTree[ tempIndex ] ) {
                offset -= this.fTree[ tempIndex ];
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
            result += this.fTree[ index ];
        }

        return result;
    }

    /* i starts from 1 here; */
    updateRowHeight( i, delta, limitTreeLiftingIndex ){
        for ( ; i < limitTreeLiftingIndex; i += i & -i ){
            this.fTree[ i ] += delta;
        }
    }

    measureRows(){
        let child = this.spacerNode?.nextElementSibling;

        if( child ){

            let index = this.startIndex,
                diff,
                buff = 0;
            
            /* We can batch-update fenwick tree, if we know, that all indexes are updated in +1 - order. */
            const lim = Math.min( this.fTree.length, 1 << 32 - Math.clz32( this.endIndex - 1 ) );


            do {
     
                diff = child.offsetHeight - this.rowHeights[ index ];

                if( diff ){
                    this.rowHeights[ index ] += diff;
                    buff += diff;
                    this.updateRowHeight( index + 1, diff, lim );                  
                }                
            }
            while( ++index < this.endIndex && ( child = child.nextElementSibling ) );

            if( buff ){
                this.updateRowHeight( lim, buff, this.fTree.length );
                this.remeasure();
            }
        }
    }
}

export default VariableSizeList;