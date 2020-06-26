import { computed, observable } from "mobx";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import times from "lodash/times";

/*
    {
        filter: [
            {
                dataKey: "example",
                value: "ssss",
                type: "includes"
            }
        ],
        group: {
            dataKey: "example2",
            value: "",
            type: "default"
        },
        sort: {
            dataKey: "example3",
            value: "ascending",
            type: "numeric"
        }
    }
*/

class RowsComplex {

    constructor( parent ){
        this.parent = parent;
    }

    @observable
    aggregators = {
        group: [],
        filter: [
            {
                dataKey: "a",
                value: "10",
                type: "includes"
            }
        ],
        sort: {}
    };

    @computed get columnsByDataKey(){
        return keyBy( this.parent.columns, "dataKey" );
    }

    @computed get rowIndexesArray(){
        return times( this.parent.rowCount );
    }

    @computed get filtered(){

        const { columnsByDataKey, parent } = this;
        const { getCellData, getRowData } = parent;
        const { filter } = this.aggregators;

        if( !getCellData || !filter.length ){
            return this.rowIndexesArray;
        }

        return this.rowIndexesArray.filter( i => {
            const row = getRowData( i );
            return filter.every(({ dataKey, value, type }) => {
                const col = columnsByDataKey[ dataKey ];
                const cellData = ( col.getCellData || getCellData )( row, i, dataKey );
                return cellData.toString().includes( value );
            });
        });
    }
/*
    @computed get grouped(){

        const { group } = this.aggregators;

        return groupBy( this.filtered, i => {
            const row = getRowData( i );
            return row.
        });
    }
    */

    @computed get flat(){
        return this.filtered;
    }

    @computed get visibleRowCount(){
        return this.flat.length;
    }
}

export default RowsComplex;