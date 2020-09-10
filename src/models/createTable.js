import { extendObservable, reaction, computed, comparer } from "mobx";
import startCase from "lodash/startCase";
import keyBy from "lodash/keyBy";
import RowsComplex from "./RowsComplex";

function getGroupNameDefault( value ){
    return this.label + ":" + "\u00A0" + value;
}

const createTable = BaseClass => class extends BaseClass {

    @computed({ equals: comparer.shallow }) get normalizedColumns(){
        return this.columns ? this.columns.map( column => {
            const finalColumn = typeof column === "string" ? { dataKey: column } : { ...column };
            
            if( !finalColumn.getCellData ){
                finalColumn.getCellData = this.getCellData;
            }

            if( !finalColumn.label ){
                finalColumn.label = startCase( finalColumn.dataKey );
            }

            if( !finalColumn.getGroupName ){
                finalColumn.getGroupName = getGroupNameDefault;
            }

            if( !finalColumn.countSummaryName ){
                finalColumn.countSummaryName = "Total";
            }

            return finalColumn;
        }) : [];
    }

    @computed({ equals: comparer.shallow }) get normalizedVisibleColumns(){
        return this.normalizedColumns.filter( column => column.visibility !== "hidden" );
    }

    @computed({ equals: comparer.shallow }) get columnsByDataKey(){
        return keyBy( this.normalizedColumns, "dataKey" );
    }

    constructor(){
        super( RowsComplex );

        extendObservable( this, {
            columns: [],
            totals: {},
            getCellData: null
        });

        this.dispose = reaction(() => this.Rows.sorted, () => this.scrollToStart() );
    }

    destructor(){
        this.Rows.destructor();
        this.dispose();
        super.destructor();
    }
}

export default createTable;