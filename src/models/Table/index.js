import throttle from "lodash/throttle";
import areArraysEqual from "../../utils/areArraysEqual";
import addSetters from "../../utils/addSetters";
import Basic from "../Basic";

const ROW_WIDTH_MEASUREMENT_INTERVAL = 100;

class Table extends Basic {

    scrollLeft = 0;

    columns = [];
    tbodyColumnWidths = [];

    calculateTbodyColumnWidths = throttle(() => {
        const node = this.getRowsContainerNode();
        if( node ){
            for( let j = 0, ch = node.children, trChildren; j < ch.length; j++ ){
                trChildren = ch[ j ].children;
                if( trChildren.length === this.columns.length ){
                    /* we must select "correct" rows without colspans, etc. */
                    const pixelWidths = [];
                    for( let td of trChildren ){
                        pixelWidths.push( td.offsetWidth );
                    }
                    if( !areArraysEqual( this.tbodyColumnWidths, pixelWidths ) ){
                        this.tbodyColumnWidths = pixelWidths;
                        this.Events.emit( "column-widths-changed" );
                    }
                    break;
                }
            }
        }
    }, ROW_WIDTH_MEASUREMENT_INTERVAL );

    constructor( params ){
        super( params );
        this.columns = params.columns || [];
        this.tbodyColumnWidths.length = this.columns.length;
        this.tbodyColumnWidths.fill( 0, 0, this.columns.length );

        this.Events
            .on( "rows-rendered", this.calculateTbodyColumnWidths )
            .on( "columns-changed", this.calculateTbodyColumnWidths )
            .on( "widget-width-changed", this.calculateTbodyColumnWidths );
    }

    destructor(){
        this.calculateTbodyColumnWidths.cancel();
        super.destructor();
    }
}

addSetters( Table.prototype, [
    "columns",
    "scrollLeft"
]);

export default Table;