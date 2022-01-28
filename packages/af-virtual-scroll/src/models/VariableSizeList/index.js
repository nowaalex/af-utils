import ListBase from "../ListBase";

class VariableSizeList extends ListBase {
    
    _itemSizes = [];
    _fTree = [];

    /*
        most significant bit of this.itemCount;
        caching it to avoid Math.clz32 calculations on every getIndex call
    */
    _msb = 0;
    
    constructor(){
        super();

        this._sub( this._measureItemsThrottled );            
    }

    _itemCountChanged(){

        const { itemCount } = this;

        if( itemCount < 0 || itemCount > 0x7fffffff ){
            throw new Error( `Wrong itemCount: ${itemCount}. Must be 0...2_147_483_647.` )
        }

        this._msb = itemCount && 1 << 31 - Math.clz32( itemCount );

        const oldItemSizes = this._itemSizes;
        const curRowHeighsLength = oldItemSizes.length;

        if( itemCount > curRowHeighsLength ){

            this._itemSizes = new Uint32Array( itemCount );
            this._fTree = new Uint32Array( itemCount + 1 );

            this._itemSizes
                .fill( this._estimatedItemSize, curRowHeighsLength )
                .set( oldItemSizes );


            /* 
                Creating fenwick tree from an array in linear time;
                It is much more efficient, than calling updateItemHeight N times.
            */

            this._fTree.set( this._itemSizes, 1 );

            for( let i = 1, j; i <= itemCount; i++ ){
                j = i + ( i & -i );
                if( j <= itemCount ){
                    this._fTree[ j ] += this._fTree[ i ];
                }
            }
        }

        this._setScrollSize( this.getOffset( itemCount ) );
    }

    getIndex( offset ){
        let index = 0;
        
        for( let bitMask = this._msb, tempIndex; bitMask !== 0; bitMask >>= 1 ){
            tempIndex = index + bitMask;
            if( tempIndex > this.itemCount ){
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
            if( index > this.itemCount ){
                throw new Error( "index must not be > itemCount" );
            }
        }

        let result = 0;

        for ( ; index > 0; index -= index & -index ){
            result += this._fTree[ index ];
        }

        return result;
    }

    getSize( itemIndex ){
        return this._itemSizes[itemIndex] || this._estimatedItemSize;
    }

    /* i starts from 1 here; */
    _updateItemHeight( i, delta, limitTreeLiftingIndex ){
        for ( ; i < limitTreeLiftingIndex; i += i & -i ){
            this._fTree[ i ] += delta;
        }
    }

    _measureItems(){

        let child = this._zeroChildNode?.nextElementSibling;

        if( child ){

            let index = this.from,
                diff,
                buff = 0;
            
            /* We can batch-update fenwick tree, if we know, that all indexes are updated in +1 - order. */
            const lim = Math.min( this._fTree.length, 1 << 32 - Math.clz32( this.to - 1 ) );

            do {
                diff = child[ this._sizeKey ] - this._itemSizes[ index ];

                if( diff ){
                    this._itemSizes[ index ] += diff;
                    buff += diff;
                    this._updateItemHeight( index + 1, diff, lim );                  
                }                
            }
            while( ++index < this.to && ( child = child.nextElementSibling ) );

            if( buff !== 0 ){
                this._updateItemHeight( lim, buff, this._fTree.length );
                this._reactOnUpdatedDimensions( this.scrollSize + buff );
            }
        }
    }
}

export default VariableSizeList;