import EventEmitter from "../../basic/EventEmitter";

class BaseClass extends EventEmitter {

    /* Provided from renderer */
    scrollTop = 0;
    scrollLeft = 0;
    rowsQuantity = 0;
    overscanRowsCount = 2;
    widgetHeight = 0;
    widgetWidth = 0;
    estimatedRowHeight = 20;
    rowsContainerNode = null;
    getRowData = null;
    getRowKey = null;

    /* Calculated inside model */
    startIndex = 0;
    endIndex = 0;
    virtualTopOffset = 0;
    widgetScrollHeight = 0;

    set( key, value ){
        if( this[ key ] !== value ){
            this[ key ] = value;
            this.emit( key );
        }
        return this;
    }

    merge( obj ){
        if( obj ){
            this.startBatch();
            for( let k in obj ){
                this.set( k, obj[ k ] );
            }
            this.endBatch();
        }
        return this;
    }
}

export default BaseClass;