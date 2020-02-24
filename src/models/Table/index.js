import throttle from "lodash/throttle";
import subtract from "lodash/subtract";
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
    orderedRows = [];

    setSortParams( sortField, sortMethod, sortDirectionSign ){
        if( this.sortMethod !== sortMethod || this.sortField !== sortField || sortDirectionSign !== this.sortDirectionSign ){
            this.sortMethod = sortMethod;
            this.sortField = sortField;
            this.sortDirectionSign = sortDirectionSign;
            this.Events.emit( "sort-params-changed" );
        }
    }

    refreshSorting = throttle(() => {
        if( this.sortField && this.totalRows > 0 ){
            const sorter = getSorter( this.rowDataGetter, this.sortField, this.sortMethod, this.sortDirectionSign );
            this.orderedRows.sort( sorter );
            this.Events.emit( "rows-order-changed" );
        }
    }, REFRESH_SORT_THROTTLING_INTERVAL );

    calculateTbodyColumnWidths = throttle(() => {
        const node = this.getRowsContainerNode();
        if( node ){
            for( let tr = node.firstElementChild; tr; tr = tr.nextElementSibling ){
                /* we must select "correct" rows without colspans, etc. */
                if( tr.childElementCount === this.columns.length ){
                    let columnWidthsChanged = false;
                    for( let td = tr.firstElementChild, j = 0, width; td; td = td.nextElementSibling, j++ ){
                        width = td.offsetWidth;
                        if( this.tbodyColumnWidths[ j ] !== width ){
                            this.tbodyColumnWidths[ j ] = width;
                            columnWidthsChanged = true;
                        }
                    }
                    if( columnWidthsChanged ){
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
        else{
            this.orderedRows.length = 0;
        }
        return this;
    }

    toggleColumnWidthMeasurerEvents( method ){
        this.Events
            [ method ]( "rows-rendered", this.calculateTbodyColumnWidths )
            [ method ]( "widget-width-changed", this.calculateTbodyColumnWidths );
        return this;
    }

    refreshHeadlessMode(){
        if( this.headlessMode ){
            this.toggleColumnWidthMeasurerEvents( "off" );
            this.calculateTbodyColumnWidths.cancel();
        }
        else{
            this.toggleColumnWidthMeasurerEvents( "on" );
            this.calculateTbodyColumnWidths();
        }
        return this;
    }

    resetColumnWidthsCache(){
        this.tbodyColumnWidths.length = this.columns.length;
        this.tbodyColumnWidths.fill( 0, 0, this.columns.length );
    }

    constructor( params ){
        super( params );

        this.Events
            .on( "headless-mode-changed", this.refreshHeadlessMode, this )
            .on( "columns-changed", this.resetColumnWidthsCache, this )
            .on( "sort-params-changed", this.refreshSorting )
            .on( "total-rows-changed", this.refreshRowsOrder, this )
            .on( "total-rows-changed", this.refreshSorting )
            .on( "rows-order-changed", this.resetMeasurementsCache, this )
            .on( "rows-order-changed", () => this.scrollToRow( 0 ) );
        
        this
            .setColumns( params.columns || [] )
            .setHeadlessMode( !!params.headlessMode )
            .setRowDataGetter( params.rowDataGetter || getRowDataInitial )
            .refreshRowsOrder( 0 );
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
    "rowDataGetter",
    "headlessMode"
]);

export default Table;