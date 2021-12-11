import ListBase from "../ListBase";

class FixedSizeList extends ListBase {

    _rowHeight = 0;

    _setRowHeight( v ){
        if( v !== this._rowHeight ){
            this._rowHeight = v;
            this._reactOnUpdatedDimensions( v * this.itemCount );
        }
    }

    _itemCountChanged(){
        if( this._rowHeight === 0 ){
            this._rowHeight = this._estimatedItemSize;
        }
        this._setWidgetScrollHeight( this._rowHeight * this.itemCount );
    }

    getIndex( offset ){
        /* rounding via bitwise hacks like |0 may not work here, because number may be > max(int32) */
        return this._rowHeight && Math.trunc( offset / this._rowHeight );
    }

    getOffset( index ){
        return index * this._rowHeight;
    }

    getSize( itemIndex ){
        return this._rowHeight || this._estimatedItemSize;
    }

    _measureItems(){
        if( this.itemCount ){
            const tgtEl = this._zeroChildNode?.nextElementSibling;
            
            if( tgtEl ){
                this._setRowHeight( tgtEl.offsetHeight );
            }   
        }
    }    
}

export default FixedSizeList;