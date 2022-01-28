import ListBase from "../ListBase";

class FixedSizeList extends ListBase {

    _rowSize = 0;

    _setRowSize( v ){
        if( v !== this._rowSize ){
            this._rowSize = v;
            this._reactOnUpdatedDimensions( v * this.itemCount );
        }
    }

    _itemCountChanged(){
        if( this._rowSize === 0 ){
            this._rowSize = this._estimatedItemSize;
        }
        this._setScrollSize( this._rowSize * this.itemCount );
    }

    getIndex( offset ){
        /* rounding via bitwise hacks like |0 may not work here, because number may be > max(int32) */
        return this._rowSize && Math.trunc( offset / this._rowSize );
    }

    getOffset( index ){
        return index * this._rowSize;
    }

    getSize( itemIndex ){
        return this._rowSize || this._estimatedItemSize;
    }

    _measureItems(){
        const tgtEl = this._zeroChildNode?.nextElementSibling;
        
        if( tgtEl ){
            this._setRowSize( tgtEl[ this._sizeKey ] );
        }   
    }    
}

export default FixedSizeList;