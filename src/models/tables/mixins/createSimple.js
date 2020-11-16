import keyBy from "lodash/keyBy";
import startCase from "lodash/startCase";

const createSimple = ListClass => class extends ListClass {

    /* Provided from renderer */
    columns = [];
    getCellData = null;
    
    /* Calculated inside model */
    normalizedColumns = [];
    normalizedVisibleColumns = [];
    columnsByDataKey = {};

    updateNormalizedColumns(){
        this.set(
            "normalizedColumns",
            this.columns ? this.columns.map( column => {
                const finalColumn = typeof column === "string" ? { dataKey: column } : { ...column };
                
                if( !finalColumn.getCellData ){
                    finalColumn.getCellData = this.getCellData;
                }

                if( !finalColumn.label ){
                    finalColumn.label = startCase( finalColumn.dataKey );
                }

                return finalColumn;
            }) : []
        );
    }

    updateNormalizedVisibleColumns(){
        this.set( "normalizedVisibleColumns", this.normalizedColumns.filter( column => column.visibility !== "hidden" ));
    }

    updateColumnsByDataKey(){
        this.set( "columnsByDataKey", keyBy( this.normalizedColumns, "dataKey" ));
    }

    constructor( initialValues ){
        super( initialValues );

        this
            .addListeners( this.updateNormalizedColumns, "columns", "getCellData" )
            .addListeners( this.updateNormalizedVisibleColumns, "normalizedColumns" )
            .addListeners( this.updateColumnsByDataKey, "normalizedColumns" )
            .merge( initialValues );   
    }
}

export default createSimple;