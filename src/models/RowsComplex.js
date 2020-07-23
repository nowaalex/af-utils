import { computed, action, reaction, autorun, observable } from "mobx";
import mapValues from "lodash/mapValues";
import times from "lodash/times";
import reduce from "lodash/reduce";
import toPairs from "lodash/toPairs";
import updateWith from "lodash/updateWith";
import get from "lodash/get";
import setWith from "lodash/setWith";
import sumBy from "lodash/sumBy";

class TotalsCachePart {

    constructor( rowsObject, groupPath, dataKey ){
        this.rowsObject = rowsObject;
        this.dataKey = dataKey;
        this.groupPath = groupPath;
    }

    countRecursively( byFieldName ){
        const { group, rowsObject, groupPath, dataKey } = this;
        return reduce( group, ( totalCount, groupValue, key ) => {
            return totalCount + rowsObject.getGroupTotals( groupPath ? groupPath.concat( key ) : [ key ] )[ dataKey ][ byFieldName ];
        }, 0 );
    }

    @computed get group(){
        return this.groupPath ? get( this.rowsObject.grouped, this.groupPath ) : this.rowsObject.grouped;
    }

    @computed get isShallow(){
        return Array.isArray( this.group );
    }

    @computed get count(){
        return this.isShallow ? this.group.length : this.countRecursively( "count" );
    }

    @computed get sum(){
        if( this.isShallow ){
            const { rowsObject: { parent: { getRowData, columnsByDataKey } }, dataKey } = this;
            const { getCellData } = columnsByDataKey[ dataKey ];
            return sumBy( this.group, i => getCellData( getRowData( i ), i, dataKey ));
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
    addGrouping( ...dataKeys ){
        for( let dataKey of dataKeys ){
            if( !this.hasGroupingForDataKey( dataKey ) ){
                this.groups.push( dataKey );
            }
        }
    }

    @action
    removeGrouping( ...dataKeys ){
        for( let dataKey of dataKeys ){
            this.groups.remove( dataKey );
        }
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

const flattenGroupedStructure = ( obj, sort, getRowData, column, expandedGroups, rowIndexes = [], groupKeyPaths = [], stack = [] ) => {

    if( Array.isArray( obj ) ){
        if( sort ){
            const { dataKey, value } = sort;
            const sign = value === "ascending" ? 1 : -1;
            obj.sort(( a, b ) => {
                const row1 = getRowData( a );
                const row2 = getRowData( b );
                if( !row1 || !row2 ){
                    return 0;
                }
                const cell1 = column.getCellData( row1, a, dataKey );
                const cell2 = column.getCellData( row2, b, dataKey );
                if( cell1 > cell2 ){
                    return sign;
                }
                if( cell1 < cell2 ){
                    return -sign;
                }
                return 0;
            });
        }
        
        rowIndexes.push( ...obj );
    }
    else{
        let curStack;
        for( let k in obj ){
            curStack = stack.concat( k );
            rowIndexes.push( -groupKeyPaths.push( curStack ) );
            if( !!get( expandedGroups, curStack ) ){
                flattenGroupedStructure( obj[ k ], sort, getRowData, column, expandedGroups, rowIndexes, groupKeyPaths, curStack );
            }
        }
    }
    
    
    return {
        rowIndexes,
        groupKeyPaths,
        length: rowIndexes.length
    };
}

class RowsComplex {

    constructor( parent ){
        this.parent = parent;

        this.dispose = reaction(
            () => !!this.aggregators.groups.length,
            () => this.expandedGroups = {}
        );

        this.dispose2 = autorun(() => {
            if( parent.rows && parent.rows.length && this.grouped ){
                this.groupTotals.clear();
            }
        });
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

    @action
    resetExpandedState( expandedGroups ){
        this.expandedGroups = expandedGroups;
    }

    @observable
    expandedGroups = {};

    aggregators = new Aggregators();

    @computed get totalsCache(){
        return mapValues( this.parent.totals || {}, ( v, k ) => new TotalsCachePart( this, null, k ) );
    }

    @computed get rowIndexesArray(){
        return times( this.parent.rows ? this.parent.rows.length : 0 );
    }

    @computed get filtered(){

        const { getRowData, columnsByDataKey } = this.parent;
        const { filtersList } = this.aggregators;

        if( !filtersList.length ){
            return this.rowIndexesArray;
        }

        return this.rowIndexesArray.filter( i => {
            const row = getRowData( i );
            return filtersList.every(([ dataKey, value ]) => {
                const cellData = row && columnsByDataKey[ dataKey ].getCellData( row, i, dataKey )
                return cellData === undefined || ( "" + cellData ).toLowerCase().includes( value.toLowerCase() );
            });
        });
    }

    @computed get grouped(){

        const { groups } = this.aggregators;

        if( !groups.length ){
            return this.filtered;
        }

        const { getRowData, columnsByDataKey } = this.parent;

        /* multilevel grouping */
        return this.filtered.reduce(( acc, v ) => {
            const row = getRowData( v );
            return updateWith(
                acc,
                row && groups.map( dataKey => "" + columnsByDataKey[ dataKey ].getCellData( row, v, dataKey )),
                indexes => indexes ? indexes.push( v ) && indexes : [ v ],
                objectSetter
            )
        }, {});
    }

    @computed get flat(){
        const { columnsByDataKey, getRowData } = this.parent;
        const { sort } = this.aggregators;
        return flattenGroupedStructure( this.grouped, sort, getRowData, sort && columnsByDataKey[ sort.dataKey ], this.expandedGroups );
    }

    groupTotals = new Map();

    getGroupTotals( path ){
        const finalPath = path.join( "." );
        let res = this.groupTotals.get( finalPath );
        if( !res ){
            res = mapValues(
                this.parent.totals || {},
                ( v, k ) => new TotalsCachePart( this, path, k )
            );
            this.groupTotals.set( finalPath, res );
        }
        return res;
    }

    @computed get visibleRowCount(){
        return this.flat.length;
    }
}

export default RowsComplex;