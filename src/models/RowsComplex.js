import { computed, action, reaction, toJS, observable } from "mobx";
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import keyBy from "lodash/keyBy";
import times from "lodash/times";
import reduce from "lodash/reduce";
import toPairs from "lodash/toPairs";
import updateWith from "lodash/updateWith";
import get from "lodash/get";
import setWith from "lodash/setWith";
import sumBy from "lodash/sumBy";

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

class TotalsCachePart2 {

    constructor( rows, groupPath, dataKey ){
        this.rows = rows;
        this.dataKey = dataKey;
        this.groupPath = groupPath;
    }

    countRecursively( byFieldName ){
        return reduce( this.group, ( totalCount, groupValue, key ) => {
            return totalCount + this.rows.getGroupTotals( this.groupPath.concat( key ) )[ this.dataKey ][ byFieldName ];
        }, 0 );
    }

    @computed get group(){
        return get( this.rows.grouped, this.groupPath );
    }

    @computed get count(){
        return Array.isArray( this.group ) ? this.group.length : this.countRecursively( "count" );
    }

    @computed get sum(){
        if( Array.isArray( this.group ) ){
            const { rows: { columnsByDataKey, parent }, dataKey } = this;
            const col = columnsByDataKey[ dataKey ];
            const { getCellData, getRowData } = parent;
            const fn = col.getCellData || getCellData;
            return sumBy( this.group, i => {
                const row = getRowData( i );
                return fn( row, i, dataKey );
            });
        }
        return this.countRecursively( "sum" );
    }

    @computed get average(){
        return this.sum / this.count;
    }
};


/*

[
    [
        1,
        2,
        5,
        7,
        8
    ],
    [
        3,
        10,
        18
    ]
]
*/

class Aggregators {

    @observable
    filtersByDataKey = {};

    /* Order is important in grouping */
    @observable
    groups = [];

    @computed get filtersList(){
        return toPairs( this.filtersByDataKey ).filter( p => p[ 1 ] );
    }

    @observable
    sort = null;

    @action
    setFiltering( dataKey, value ){
        this.filtersByDataKey[ dataKey ] = value;
    }

    @action
    setSorting( v ){
        this.sort = typeof v === "function" ? v( this.sort ) : v;
    }

    hasGroupingForDataKey( dataKey ){
        return this.groups.includes( dataKey );
    }

    @action
    addGrouping( dataKey ){
        if( !this.hasGroupingForDataKey( dataKey ) ){
            this.groups.push( dataKey );
        }
    }

    @action
    removeGrouping( dataKey ){
        this.groups.remove( dataKey );
    }

    @action
    toggleGrouping( dataKey ){
        if( this.hasGroupingForDataKey( dataKey ) ){
            this.removeGrouping( dataKey );
        }
        else{
            this.addGrouping( dataKey );
        }
    }
};

const objectSetter = nsObject => typeof nsObject === "object" ? nsObject : {};

const flattenGroupedStructure = ( obj, expandedGroups, rowIndexes = [], groupKeyPaths = [], stack = [] ) => {

    if( Array.isArray( obj ) ){
        rowIndexes.push( ...obj );
    }
    else{
        let curStack;
        for( let k in obj ){
            curStack = stack.concat( k );
            rowIndexes.push( -groupKeyPaths.push( curStack ) );
            if( !!get( expandedGroups, curStack ) ){
                flattenGroupedStructure( obj[ k ], expandedGroups, rowIndexes, groupKeyPaths, curStack );
            }
        }
    }
    
    
    return {
        rowIndexes,
        groupKeyPaths
    };
}

class RowsComplex {

    constructor( parent ){
        this.parent = parent;

        this.dispose = reaction(
            () => !!this.aggregators.groups.length,
            () => this.expandedGroups = {}
        );

        this.dispose2 = reaction(
            () => this.grouped,
            () => this.groupTotals.clear()
        );
    }

    destructor(){
        this.dispose();
        this.dispose2();
    }

    @action
    setExpandedState( v, boolFlag ){
        setWith( this.expandedGroups, v, boolFlag, objectSetter );
    }

    isGroupExpanded( path ){
        return !!get( this.expandedGroups, path );
    }

    @observable
    expandedGroups = {};

    @observable
    aggregators = new Aggregators();

    @computed get totalsCache(){
        return this.parent.totals ? mapValues( this.parent.totals, ( v, k ) => new TotalsCachePart( this, k ) ) : {};
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
        const { filtersList } = this.aggregators;

        if( !getCellData || !filtersList.length ){
            return this.rowIndexesArray;
        }

        return this.rowIndexesArray.filter( i => {
            const row = getRowData( i );
            return filtersList.every(([ dataKey, value ]) => {
                const col = columnsByDataKey[ dataKey ];
                const cellData = row && ( col.getCellData || getCellData )( row, i, dataKey );
                return cellData === undefined || ( "" + cellData ).toLowerCase().includes( value.toLowerCase() );
            });
        });
    }

    @computed get grouped(){

        const { groups } = this.aggregators;

        if( !groups.length ){
            return this.filtered;
        }

        const { columnsByDataKey, parent } = this;
        const { getCellData, getRowData } = parent;

        /* multilevel grouping */
        return this.filtered.reduce(( acc, v ) => {
            const row = getRowData( v );
            return updateWith(
                acc,
                row && groups.map( dataKey => {
                    const col = columnsByDataKey[ dataKey ];
                    return ( col.getCellData || getCellData )( row, v, dataKey );
                }),
                indexes => indexes ? indexes.push( v ) && indexes : [ v ],
                objectSetter
            )
        }, {});
    }

    @computed get sorted(){
        const { columnsByDataKey, aggregators: { sort }, parent } = this;

       /* if( sort && sort.dataKey ){
            const { dataKey, value } = sort;
            const { getCellData, getRowData } = parent;
            const col = columnsByDataKey[ dataKey ];
            const fn = col.getCellData || getCellData;
            const sign = value === "ascending" ? 1 : -1;
            return mapValues( this.grouped, v => v.sort(( a, b ) => {
                const row1 = getRowData( a );
                const row2 = getRowData( b );
                if( !row1 || !row2 ){
                    return 0;
                }
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
        }*/
        
        return this.grouped;
    }

    @computed get flat(){
        return flattenGroupedStructure( this.sorted, this.expandedGroups );
    }

    groupTotals = new Map();

    getGroupTotals( path ){
        const finalPath = path.join( "." );
        let res = this.groupTotals.get( finalPath );
        if( !res ){
            res = this.parent.totals ? mapValues(
                this.parent.totals,
                ( v, k ) => new TotalsCachePart2( this, path, k )
            ) : {};
            this.groupTotals.set( finalPath, res );
        }
        return res;
    }

    @computed get visibleRowCount(){
        return this.flat.rowIndexes.length;
    }
}

export default RowsComplex;