import ListBase from "../ListBase";

class FixedSizeList extends ListBase {

    rowHeight = 0;

    setRowHeight( v ){
        if( v !== this.rowHeight ){
            this.rowHeight = v;
            this.remeasure();
        }
    }

    getIndex( offset ){
        /* rounding via bitwise hacks like |0 may not work here, because number may be > max(int32) */
        return this.rowHeight && Math.trunc( offset / this.rowHeight );
    }

    getOffset( index ){
        return index * this.rowHeight;
    }

    measureRows(){
        if( this.rowsQuantity ){
            const tgtEl = this.spacerNode?.nextElementSibling;
            
            if( tgtEl ){
                this.setRowHeight( tgtEl.offsetHeight );
            }   
        }
    }    
}

export default FixedSizeList;