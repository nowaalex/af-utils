import debounce from "lodash/debounce";
import subtract from "lodash/subtract";
import add from "lodash/add";

const OrderedRowsCache = Uint32Array;
const TbodyColumnWidthsCache = Uint32Array;

const REFRESH_SORT_DEBOUNCE_INTERVAL = 500;

const L = new Intl.Collator();

const getValueForSorting = ( srcVal, rowIndex, fieldName, defaultValue, getRowData, getCellData ) => {
    const result = getRowData( srcVal );
    if( result ){
        return getCellData ? getCellData( result, rowIndex ) : result[ fieldName ];
    }
    return defaultValue;
}

const getSorter = ( getRowData, fieldName, method, getCellData, directionSign ) => {
    const fn = method === "locale" ? L.compare : subtract;
    const defaultValue = method === "locale" ? "" : 0;

    return ( a, b, i ) => {
        const v1 = getValueForSorting( a, i, fieldName, defaultValue, getRowData, getCellData );
        const v2 = getValueForSorting( b, i, fieldName, defaultValue, getRowData, getCellData );
        return fn( v1, v2 ) * directionSign;
    };
};

const reduceRange = ( totalRows, dataKey, getRowData, getCellData, startValue, getNewRes ) => {
    let res = startValue;
    for( let i = 0, rowData, cellData; i < totalRows; i++ ){
        rowData = getRowData( i );
        cellData = getCellData ? getCellData( rowData, i ) : rowData[ dataKey ];
        res = getNewRes( res, cellData );
    }
    return res;
}

/*
    We could use simple object literal,
    but constructors with stable-order this initialization enforce "hidden-classes" v8 optimization
*/
class TotalsCachePart {
    count = 0;
    sum = 0;
    average = 0.0;
};

/*
    can't extend from both FixedSizeList and VariableSizeList, so exporting compositor
*/
const createTable = ( BaseClass, constructorCallback ) => class extends BaseClass {

    columns = [];
    totals = {};
    headlessMode = false;

    sortColumnIndex = -1;
    sortDirectionSign = 1;

    scrollLeft = 0;
    tbodyColumnWidths = null;
    orderedRows = new OrderedRowsCache( 0 );

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
            
            for( let j = 0, totalType, oldVal, newVal, tmpSum; j < curTotals.length; j++ ){
                totalType = curTotals[ j ];
                oldVal = curCachePart[ totalType ];
                switch( totalType ){
                    case "count":
                        newVal = this.totalRows;
                        break;
                    case "sum":
                    case "average":
                        if( tmpSum === undefined ){
                            tmpSum = reduceRange( this.totalRows, dataKey, this.rowDataGetter, cellDataGetter, 0, add );
                        }
                        newVal = totalType === "sum" ? tmpSum : tmpSum / this.totalRows;
                        break;
                    case "min":
                    case "max":
                        newVal = reduceRange(
                            this.totalRows,
                            dataKey,
                            this.rowDataGetter,
                            cellDataGetter,
                            totalType === "min" ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER,
                            Math[totalType]
                        );
                        break;
                    default:
                        if( process.env.NODE_ENV !== "production" ){
                            throw new Error( `Wrong total type: ${totalType}` );
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

    refreshRowsOrder(){
        if( this.orderedRows.length !== this.totalRows ){
            const rows = this.orderedRows = new OrderedRowsCache( this.totalRows );
            for( let j = 1; j < rows.length; j++ ){
                rows[ j ] = j;
            }
        }
        return this;
    }

    resetColumnWidthsCache(){
        this.tbodyColumnWidths = new TbodyColumnWidthsCache( this.columns.length );
    }

    constructor(){
        super();

        this
            .on( "#columns", this.resetColumnWidthsCache )
            .on( "#columns", this.refreshTotals )
            .on( "#columns", this.refreshSorting )
            .on( "#totalRows", this.refreshRowsOrder )
            .on( "#totalRows", this.refreshSorting )
            .on( "#totalRows", this.refreshTotals )
            .on( "sort-params-changed", this.refreshSorting )
            .on( "#rowDataGetter", this.refreshSorting )
            .on( "#rowDataGetter", this.refreshTotals )
            .on( "#rowsOrder", this.scrollToStart )
            .on( "#totals", this.refreshTotals )
        
            .refreshRowsOrder();

        if( constructorCallback ){
            constructorCallback( this );
        }
    }

    destructor(){
        this.refreshSorting.cancel();
        this.refreshTotals.cancel();
        super.destructor();
    }
}

export default createTable;