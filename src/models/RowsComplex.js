import debounce from "../utils/debounce";

/*
    {
        filter: [
            {
                dataKey: "example",
                value: "ssss",
                type: "includes"
            }
        ],
        group: [
            {
                dataKey: "example2",
                value: "",
                type: "default"
            }
        ],
        sort: {
            dataKey: "example3",
            value: "asc",
            type: "numeric"
        }
    }
*/

class RowsComplex {

    constructor( table ){
        this.table = table;

        table
            .on( "#getRowData", this.recalculateModifiers )
            .on( "#totalRows", this.recalculateModifiers )
            .on( "#getRowKey", this.recalculateModifiers );
    }

    ready = false;

    modifiers = {
        group: [],
        filter: [],
        sort: {}
    };

    filtered = [];
    grouped = new Map();
    flat = [];

    recalculateFilters = () => {

        const { totalRows, getCellData, getRowData, columns } = this.table;

        if( this.filtered.length !== totalRows ){
            this.filtered = new Uint32Array( totalRows );
        }

        let filteredRowsQuantity = 0;

        for( let j = 0, row, cellValue; j < totalRows; j++ ){
            row = getRowData( j );
            const passes = this.modifiers.filter.every(({ dataKey, value, type }) => {
                const col = columns.find( c => c.dataKey === dataKey );
                cellValue = ( col.getCellData || getCellData )( row, j, dataKey );
                return cellValue.includes( value );
            });
            if( passes ){
                this.filtered[ filteredRowsQuantity++ ] = j;
            }
        }
    }

    recalculateGrouping = () => {
        this.grouped.clear();

        for( let j = 0; j < this.modifiers.group.length; j++ ){
            const { dataKey, value } = this.modifiers.group[ j ];
            const rows = [];
            this.grouped.set( dataKey, rows );
            for( let i = 0, row; j < this.filtered.length; j++ ){
                row = getRowData( this.filtered[ j ] );
    
            }
        }
        
    }


    

    changeModifiers( filterType, filterColumn, filterValue, operation ){

    }
}

export default RowsComplex;