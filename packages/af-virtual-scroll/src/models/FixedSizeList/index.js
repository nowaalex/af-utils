import ListBase from "../ListBase";

class FixedSizeList extends ListBase {

    _rowHeight = 0;

    _setRowHeight( v ){
        if( v !== this._rowHeight ){
            this._rowHeight = v;
            this._reactOnUpdatedDimensions( v * this.rowsQuantity );
        }
    }

    _rowsQuantityChanged(){
        if( this._rowHeight === 0 ){
            this._rowHeight = this._estimatedRowHeight;
        }
        this._setWidgetScrollHeight( this._rowHeight * this.rowsQuantity );
    }

    getIndex( offset ){
        /* rounding via bitwise hacks like |0 may not work here, because number may be > max(int32) */
        return this._rowHeight && Math.trunc( offset / this._rowHeight );
    }

    getOffset( index ){
        return index * this._rowHeight;
    }

    _measureRows(){
        if( this.rowsQuantity ){
            const tgtEl = this._zeroChildNode?.nextElementSibling;
            
            if( tgtEl ){
                this._setRowHeight( tgtEl.offsetHeight );
            }   
        }
    }    
}

export default FixedSizeList;