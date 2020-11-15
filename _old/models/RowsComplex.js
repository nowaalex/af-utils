import { computed, action, reaction, autorun, observable, makeObservable, makeAutoObservable } from "mobx";
import mapValues from "lodash/mapValues";
import times from "lodash/times";
import reduce from "lodash/reduce";
import toPairs from "lodash/toPairs";
import updateWith from "lodash/updateWith";
import get from "lodash/get";
import sumBy from "lodash/sumBy";

class TotalsCachePart {

    constructor( rowsObject, groupPath, dataKey ){

        this.rowsObject = rowsObject;
        this.dataKey = dataKey;
        this.groupPath = groupPath;

        makeAutoObservable( this, {
            countRecursively: false
        });
    }

    countRecursively( byFieldName ){
        const { group, rowsObject, groupPath, dataKey } = this;
        return reduce( group, ( totalCount, groupValue, key ) => {
            return totalCount + rowsObject.getGroupTotals( groupPath ? groupPath.concat( key ) : [ key ] )[ dataKey ][ byFieldName ];
        }, 0 );
    }

    get group(){
        return this.groupPath ? get( this.rowsObject.grouped, this.groupPath ) : this.rowsObject.grouped;
    }

    get isShallow(){
        return Array.isArray( this.group );
    }

    get count(){
        return this.isShallow ? this.group.length : this.countRecursively( "count" );
    }

    get sum(){
        if( this.isShallow ){
            const { rowsObject: { parent: { getRowData, columnsByDataKey } }, dataKey } = this;
            const { getCellData } = columnsByDataKey[ dataKey ];
            return sumBy( this.group, i => getCellData( getRowData( i ), i, dataKey ));
        }
        return this.countRecursively( "sum" );
    }

    get average(){
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

    filtersByDataKey = {};

    /* Order is important in grouping */
    groups = [];

    get filtersList(){
        return toPairs( this.filtersByDataKey ).filter( p => p[ 1 ] );
    }

    sort = null;

    setFiltering( dataKey, value ){
        if( dataKey ){
            if( typeof dataKey === "string" ){
                this.filtersByDataKey[ dataKey ] = value;
            }
            else if( typeof dataKey === "object" ){
                Object.assign( this.filtersByDataKey, dataKey );
            }
        }
    }

    setSorting( v ){
        this.sort = typeof v === "function" ? v( this.sort ) : v;
    }

    hasGroupingForDataKey( dataKey ){
        return this.groups.includes( dataKey );
    }

    addGrouping( ...dataKeys ){
        for( let dataKey of dataKeys ){
            if( !this.hasGroupingForDataKey( dataKey ) ){
                this.groups.push( dataKey );
            }
        }
    }

    removeGrouping( ...dataKeys ){
        for( let dataKey of dataKeys ){
            this.groups.remove( dataKey );
        }
    }

    toggleGrouping( dataKey ){
        if( this.hasGroupingForDataKey( dataKey ) ){
            this.removeGrouping( dataKey );
        }
        else{
            this.addGrouping( dataKey );
        }
    }

    constructor(){
        makeAutoObservable( this, {
            hasGroupingForDataKey: false,
            setFiltering: action
        });
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

        makeAutoObservable( this, {
            isGroupExpanded: false,
            aggregators: false,
            groupTotals: false,
            getGroupTotals: false,
            destructor: false
        });

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

    toggleExpandedState( path ){
        updateWith( this.expandedGroups, path, v => !v, objectSetter );
    }
    
    isGroupExpanded( path ){
        return !!get( this.expandedGroups, path );
    }

    resetExpandedState( expandedGroups ){
        this.expandedGroups = expandedGroups;
    }

    expandedGroups = {};

    aggregators = new Aggregators();

    get totalsCache(){
        return mapValues( this.parent.totals || {}, ( v, k ) => new TotalsCachePart( this, null, k ) );
    }

    get rowIndexesArray(){
        return times( this.parent.rows ? this.parent.rows.length : 0 );
    }

    get filtered(){

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

    get grouped(){

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

    get flat(){
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

    get visibleRowCount(){
        return this.flat.length;
    }
}

export default RowsComplex;