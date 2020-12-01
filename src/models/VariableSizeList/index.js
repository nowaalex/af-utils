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

    /*
        i starts from 1 here;

        TODO:
            * we can put < this.rowsQuantity here, but in this case grow must be optimized
    */
    updateRowHeight( i, delta ){
        for ( ; i < this.fTree.length; i += i & -i ){
            this.fTree[ i ] += delta;
        }
    }

    measureRows(){
        const node = this.rowsContainerNode;

        if( node ){

            let index = this.startIndex,
                diff,
                cacheChanged = false;

            for( let child of node.children ){
     
                diff = child.offsetHeight - this.rowHeights[ index ];

                if( diff ){
                    cacheChanged = true;
                    this.rowHeights[ index ] += diff;

                    /*
                        TODO:
                            maybe buffer these updates somehow?
                    */
                    this.updateRowHeight( index + 1, diff );                  
                }
                
                index++;
            }

            if( cacheChanged ){
                this.remeasure();
            }
        }
    }
}

export default VariableSizeList;