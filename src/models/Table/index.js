import throttle from "lodash/throttle";
import subtract from "lodash/subtract";
import areArraysEqual from "../../utils/areArraysEqual";
import addSetters from "../../utils/addSetters";
import Basic from "../Basic";

const ROW_WIDTH_MEASUREMENT_INTERVAL = 100;
const REFRESH_SORT_THROTTLING_INTERVAL = 200;

const getRowDataInitial = () => {
    throw new Error( "getRowData must be provided for table" );
};

const fillOrderedRowsArray = ( arr, startIndex, endIndex ) => {
    while( startIndex < endIndex ){
        arr[ startIndex ] = startIndex++;
    }
};

const L = new Intl.Collator();

const getSorter = ( getRowData, fieldName, method, directionSign ) => {
    const fn = method === "locale" ? L.compare : subtract;
    const defaultValue = method === "locale" ? "" : 0;

    return ( a, b ) => {
        a = getRowData( a );
        a = a ? a[ fieldName ] : defaultValue;
        b = getRowData( b );
        b = b ? b[ fieldName ] : defaultValue;
        return fn( a, b ) * directionSign;
    };
};

class Table extends Basic {

    sortField = null;
    sortMethod = null;
    sortDirectionSign = 1;

    scrollLeft = 0;
    tbodyColumnWidths = [];

    setSortParams( sortField, sortMethod, sortDirectionSign ){
        if( this.sortField !== sortField || this.sortMethod !== sortMethod || sortDirectionSign !== this.sortDirectionSign ){
            this.sortField = sortField;
            this.sortMethod = sortMethod;
            this.sortDirectionSign = sortDirectionSign;
            this.Events.emit( "sort-params-changed" );
        }
    }

    refreshSorting = throttle(() => {
        if( this.sortField ){
            const sorter = getSorter( this.rowDataGetter, this.sortField, this.sortMethod, this.sortDirectionSign );
            this.orderedRows.sort( sorter );
            this.Events.emit( "rows-order-changed" );
        }
    }, REFRESH_SORT_THROTTLING_INTERVAL );

    calculateTbodyColumnWidths = throttle(() => {
        const node = this.getRowsContainerNode();
        if( node ){
            for( let child of node.children ){
                const tds = child.children;
                if( tds.length === this.columns.length ){
                    /* we must select "correct" rows without colspans, etc. */
                    const pixelWidths = [];
                    for( let td of tds ){
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

    refreshRowsOrder( prevTotalRows ){
        if( this.totalRows > 0 ){
            this.orderedRows.length = this.totalRows;
            fillOrderedRowsArray( this.orderedRows, this.totalRows > prevTotalRows ? prevTotalRows : 0, this.totalRows );
        }
    }

    constructor( params ){
        super( params );
        this.columns = params.columns || [];
        this.rowDataGetter = params.rowDataGetter || getRowDataInitial;
        this.tbodyColumnWidths.length = this.columns.length;
        this.tbodyColumnWidths.fill( 0, 0, this.columns.length );
        this.orderedRows = params.totalRows > 0 ? Array( params.totalRows ) : [];
        fillOrderedRowsArray( this.orderedRows, 0, params.totalRows );

        this.Events
            .on( "rows-rendered", this.calculateTbodyColumnWidths )
            .on( "columns-changed", this.calculateTbodyColumnWidths )
            .on( "widget-width-changed", this.calculateTbodyColumnWidths )
            .on( "sort-params-changed", this.refreshSorting )
            .on( "total-rows-changed", this.refreshRowsOrder, this )
            .on( "total-rows-changed", this.refreshSorting )
            .on( "rows-order-changed", this.resetMeasurementsCache, this )
            .on( "rows-order-changed", () => this.scrollToRow( 0 ) );
    }

    destructor(){
        this.calculateTbodyColumnWidths.cancel();
        this.refreshSorting.cancel();
        super.destructor();
    }
}

addSetters( Table.prototype, [
    "columns",
    "scrollLeft",
    "rowDataGetter"
]);

export default Table;