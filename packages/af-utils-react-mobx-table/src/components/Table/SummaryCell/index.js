import { observer } from "mobx-react-lite";

const getCount = rowIndexes => {

    let total = 0;

    if( Array.isArray( rowIndexes ) ){
        total += rowIndexes.length;
    }
    else {
        for( let nested of rowIndexes.values() ){
            if( nested ){
                total += getCount( nested );
            }
        }
    }

    return total;
}

const getSum = ( rowIndexes, key, getRowData ) => {

    let total = 0;

    if( Array.isArray( rowIndexes ) ){
        let row;
        for( const j of rowIndexes ){
            row = getRowData( j );
            if( row ){
                total += row[ key ];
            }
        }
    }
    else {
        for( const nested of rowIndexes.values() ){
            if( nested ){
                total += getSum( nested, key, getRowData );
            }
        }
    }

    return total;
}

const SummaryCell = ({ m, column, rowIndexes }) => {

    if( column.totals === "count" ){
        return getCount( rowIndexes );
    }

    if( column.totals === "sum" ){

        const sum = getSum( rowIndexes, column.key, m.getRowData );

        if( column.formatTotal ){
            const secondArg = m.getTotalsFormattingHelper ? m.getTotalsFormattingHelper() : null;
            return column.formatTotal( sum, secondArg );
        }

        if( column.format ){
            return column.format( sum );
        }
        
        return sum;
    }

    return null;
};

export default observer( SummaryCell );