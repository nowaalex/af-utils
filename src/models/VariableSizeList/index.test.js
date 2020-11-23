import VariableSizeList from "./index";
import r from "lodash/random";

const ROWS_QUANTITY = 100;
const UPDATES_QUANTITY = 15;

const ROW_HEIGHTS = new Uint32Array( ROWS_QUANTITY );

const getOffsetUnoptimized = n => {
    let offset = 0;
    for( let j = 0; j < n; j++ ){
        offset += ROW_HEIGHTS[ j ];
    }
    return offset;
}

const getIndexUnoptimized = offset => {
    let index = -1;

    do {
        offset -= ROW_HEIGHTS[ ++index ];
    }
    while( offset >= 0 );

    return index;
}

describe( "VariableSizeList works ok", () => {

    test( "it sums ok", () => {

        const VSList = new VariableSizeList();
        VSList.setViewParams( 0, 2, ROWS_QUANTITY, null );


        for( let i = 0, sum; i < UPDATES_QUANTITY; i++ ){

            sum = 0;

            for( let j = 0, diff; j < ROWS_QUANTITY; j++ ){
                diff = r( 5 - i, 20 );
                sum += diff;
                VSList.updateRowHeight( j, diff );
                ROW_HEIGHTS[ j ] += diff;
            }

            for( let j = 0; j < ROWS_QUANTITY; j++ ){
                expect( VSList.getOffset( j ) ).toBe( getOffsetUnoptimized( j ) );
            }
    
            for( let j = 0; j < sum; j++ ){
                expect( VSList.getIndex( j ) ).toBe( getIndexUnoptimized( j ) );
            }
        }
    });
})