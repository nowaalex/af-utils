import VariableSizeList from "./index";
import r from "lodash/random";

const ROWS_QUANTITY = 100;
const UPDATES_QUANTITY = 1;

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

describe( "VariableSizeList model works", () => {

    const VSList = new VariableSizeList();

    test( "Default itemCount is zero", () => {
        expect( VSList.itemCount ).toEqual( 0 );
    });

    test( "Calcultions with zero itemCount work correctly", () => {
        expect( VSList.getIndex( 0 ) ).toEqual( 0 );
        expect( VSList.getOffset( 0 ) ).toEqual( 0 );
    });

    test( "Setting itemCount > max(int32) or < 0 throws error", () => {
        expect(() => VSList._setParams( 0, 2, -1, false )).toThrow();
        expect(() => VSList._setParams( 0, 2, 0x7fffffff + 1, false )).toThrow();
    });

    test( "Summation works correctly", () => {

        VSList._setParams( 0, 2, ROWS_QUANTITY, false );

        for( let i = 0, sum; i < UPDATES_QUANTITY; i++ ){

            sum = 0;

            for( let j = 0, diff; j < ROWS_QUANTITY; j++ ){
                diff = r( 5 - i, 20 );
                sum += diff;
                VSList._updateItemHeight( j + 1, diff, VSList._fTree.length );
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
});