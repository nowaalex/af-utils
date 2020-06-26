import { computed, action, observable } from "mobx";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import keyBy from "lodash/keyBy";
import times from "lodash/times";
import reduce from "lodash/reduce";

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

class TotalsCachePart {

    constructor( rows, dataKey ){
        this.rows = rows;
        this.dataKey = dataKey;
    }

    @computed get count(){
        return this.rows.parent.rowCount;
    }

    @computed get sum(){
        let res = 0;
        const { rows: { columnsByDataKey, parent }, dataKey } = this;
        const col = columnsByDataKey[ dataKey ];
        const { getCellData, getRowData, rowCount } = parent;
        const fn = col.getCellData || getCellData;
        for( let i = 0, row, cellData; i < rowCount; i++ ){
            row = getRowData( i );
            cellData = fn( row, i, dataKey );
            res += cellData;
        }
        return res;
    }

    @computed get average(){
        return this.sum / this.count;
    }
};

class RowsComplex {

    constructor( parent ){
        this.parent = parent;
    }

    @observable
    aggregators = {
        group: {
            dataKey: "country",
            value: "",
            type: "default"
        }
    };

    @action
    modifyAggregators( arg ){
        Object.assign( this.aggregators, arg );
    }

    @computed get totalsCache(){
        return mapValues( this.parent.totals, ( v, k ) => new TotalsCachePart( this, k ) );
    }

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

        if( !getCellData || !filter || !filter.length ){
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

    @computed get grouped(){

        const { group } = this.aggregators;

        if( !group ){
            return {
                all: this.filtered
            };
        }

        const { dataKey } = group;
        const { columnsByDataKey, parent } = this;
        const { getCellData, getRowData } = parent;

        const col = columnsByDataKey[ dataKey ];

        return groupBy( this.filtered, i => {
            const row = getRowData( i );
            const cellData = ( col.getCellData || getCellData )( row, i, dataKey );
            return cellData;
        });
    }

    @computed get sorted(){
        const { columnsByDataKey, aggregators: { sort }, parent } = this;

        if( sort ){
            const { dataKey, value } = sort;
            const { getCellData, getRowData } = parent;
            const col = columnsByDataKey[ dataKey ];
            const fn = col.getCellData || getCellData;
            const sign = value === "ascending" ? 1 : -1;
            return mapValues( this.grouped, v => v.sort(( a, b ) => {
                const row1 = getRowData( a );
                const row2 = getRowData( b );
                const cell1 = fn( row1, a, dataKey );
                const cell2 = fn( row2, b, dataKey );
                if( cell1 > cell2 ){
                    return sign;
                }
                if( cell1 < cell2 ){
                    return -sign;
                }
                return 0;
            }));
        }
        
        return this.grouped;
    }

    @computed get flat(){
        return reduce( this.sorted, ( result, groupArr, groupName ) => {
            result.push( groupName, ...groupArr );
            return result;
        }, []);
    }

    @computed get visibleRowCount(){
        return this.flat.length;
    }
}

export default RowsComplex;