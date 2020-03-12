import debounce from "lodash/debounce";
import subtract from "lodash/subtract";
import VariableSizeList from "../VariableSizeList";

const REFRESH_SORT_DEBOUNCE_INTERVAL = 500;

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
        return ( a, b, i ) => {
            a = getRowData( a );
            a = a ? getCellData( a, i ) : defaultValue;
            b = getRowData( b );
            b = b ? getCellData( b, i ) : defaultValue;
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

const calculateSum = ( totalRows, dataKey, getRowData, getCellData ) => {
    let res = 0;
    for( let i = 0, rowData, cellData; i < totalRows; i++ ){
        rowData = getRowData( i );
        cellData = getCellData ? getCellData( rowData, i ) : rowData[ dataKey ];
        if( cellData ){
            res += cellData;
        }
    }
    return res;
};

/*
    We could use simple object literal,
    but constructors with stable-order this initialization enforce "hidden-classes" v8 optimization
*/
class TotalsCachePart {
    count = 0;
    sum = 0;
    average = 0.0;
};

class Table extends VariableSizeList {

    columns = [];
    totals = {};
    headlessMode = false;

    sortColumnIndex = -1;
    sortDirectionSign = 1;

    scrollLeft = 0;
    tbodyColumnWidths = null;
    orderedRows = [];

    /*
        We do not want to recalculate totals too often, so caching them in object by column dataKey
    */
    totalsCache = Object.create( null );


    /*
        TODO:
            make this call throttled
    */

    refreshTotalsForColumnRaw( dataKey, cellDataGetter ){
        const curTotals = this.totals && this.totals[ dataKey ];
        if( curTotals ){
            let curCachePart = this.totalsCache[ dataKey ];

            if( !curCachePart ){
                curCachePart = this.totalsCache[ dataKey ] = new TotalsCachePart();
            }
            
            for( let j = 0, totalType, oldVal, newVal; j < curTotals.length; j++ ){
                totalType = curTotals[ j ];
                oldVal = curCachePart[ totalType ];
                switch( curTotals[ j ] ){
                    case "count":
                        newVal = this.totalRows;
                        break;
                    case "sum":
                        newVal = calculateSum( this.totalRows, dataKey, this.rowDataGetter, cellDataGetter );
                        break;
                    case "average":
                        /* Todo: optimize, if we already calculated sum */
                        newVal = calculateSum( this.totalRows, dataKey, this.rowDataGetter, cellDataGetter ) / this.totalRows;
                        break;
                    default:
                        if( process.env.NODE_ENV !== "production" ){
                            console.error( `Unknown totals type: ${curTotals[ j ]}` );
                        }
                }
                if( oldVal !== newVal ){
                    curCachePart[ totalType ] = newVal;
                    this.emit( "totals-calculated" );
                }
            }
        }
        else if( process.env.NODE_ENV !== "production" ){
            console.log( `Asked to recalculate totals for: ${dataKey}; doing nothing;` );
        }
        return this;
    }

    refreshTotalsForColumn( dataKey ){
        const col = this.columns.find( c => c.dataKey === dataKey );
        if( col ){
            this.refreshTotalsForColumnRaw( dataKey, col.getCellData );
        }
        return this;
    }

    refreshTotals = debounce(() => {
        for( let j = 0, dataKey, getCellData; j < this.columns.length; j++ ){
            ({ dataKey, getCellData } = this.columns[ j ]);
            this.refreshTotalsForColumnRaw( dataKey, getCellData );
        }
        return this;
    }, 100 );

    setSortParams( colIndex, sortDirectionSign ){
        if( this.sortColumnIndex !== colIndex || sortDirectionSign !== this.sortDirectionSign ){
            this.sortColumnIndex = colIndex;
            this.sortDirectionSign = sortDirectionSign;
            this.emit( "sort-params-changed" );
        }
    }

    refreshSorting = debounce(() => {
        if( this.sortColumnIndex > -1 && this.totalRows > 0 ){
            const { sort, dataKey, getCellData } = this.columns[ this.sortColumnIndex ];
            if( sort ){
                const sorter = getSorter( this.rowDataGetter, dataKey, sort, getCellData, this.sortDirectionSign );
                this.orderedRows.sort( sorter );
                this.emit( "#rowsOrder" );
            }
        }
    }, REFRESH_SORT_DEBOUNCE_INTERVAL );

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

    resetColumnWidthsCache(){
        this.tbodyColumnWidths = new Uint32Array( this.columns.length );
    }

    constructor( params ){
        super( params );

        this
            .on( "#columns", this.resetColumnWidthsCache, this )
            .on( "#columns", this.refreshTotals )
            .on( "#columns", this.refreshSorting )
            .on( "#totalRows", this.refreshRowsOrder, this )
            .on( "#totalRows", this.refreshSorting )
            .on( "#totalRows", this.refreshTotals )
            .on( "sort-params-changed", this.refreshSorting )
            .on( "#rowDataGetter", this.refreshSorting )
            .on( "#rowDataGetter", this.refreshTotals )
            .on( "#rowsOrder", this.resetMeasurementsCache, this )
            .on( "#rowsOrder", () => this.scrollToRow( 0 ) )
            .on( "#totals", this.refreshTotals )
        
            .refreshRowsOrder( 0 );
    }

    destructor(){
        this.refreshSorting.cancel();
        this.refreshTotals.cancel();
        super.destructor();
    }
}

export default Table;