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

const getSorter = ( getRowData, fieldName, method, getCellData, directionSign ) => {
    const fn = method === "locale" ? L.compare : subtract;
    const defaultValue = method === "locale" ? "" : 0;

    if( getCellData ){
        return ( a, b ) => {
            a = getRowData( a );
            a = a ? getCellData( a ) : defaultValue;
            b = getRowData( b );
            b = b ? getCellData( b ) : defaultValue;
            return fn( a, b ) * directionSign;
        };
    }
    
    return ( a, b ) => {
        a = getRowData( a );
        a = a ? a[ fieldName ] : defaultValue;
        b = getRowData( b );
        b = b ? b[ fieldName ] : defaultValue;
        return fn( a, b ) * directionSign;
    };
};

class Table extends Basic {

    sortColumnIndex = -1;
    sortDirectionSign = 1;

    scrollLeft = 0;
    tbodyColumnWidths = [];
    orderedRows = [];

    setSortParams( colIndex, sortDirectionSign ){
        if( this.sortColumnIndex !== colIndex || sortDirectionSign !== this.sortDirectionSign ){
            this.sortColumnIndex = colIndex;
            this.sortDirectionSign = sortDirectionSign;
            this.Events.emit( "sort-params-changed" );
        }
    }

    refreshSorting = throttle(() => {
        if( this.sortColumnIndex > -1 && this.totalRows > 0 ){
            const { sort, dataKey, getCellData } = this.columns[ this.sortColumnIndex ];
            if( sort ){
                const sorter = getSorter( this.rowDataGetter, dataKey, sort, getCellData, this.sortDirectionSign );
                this.orderedRows.sort( sorter );
                this.Events.emit( "rows-order-changed" );
            }
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
            .on( "total-rows-changed", this.refreshRowsOrder, this )
            .on( "total-rows-changed", this.refreshSorting )
            .on( "sort-params-changed", this.refreshSorting )
            .on( "columns-changed", this.refreshSorting )
            .on( "row-data-getter-changed", this.refreshSorting )
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