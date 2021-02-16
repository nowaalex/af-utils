import FixedSizeList from "./index";

describe( "FixedSizeList model works", () => {

    const FList = new FixedSizeList();

    test( "Default rowsQuantity is zero", () => {
        expect( FList.rowsQuantity ).toEqual( 0 );
    });

    test( "Calcultions with zero rowsQuantity work correctly", () => {
        expect( FList.getIndex( 0 ) ).toEqual( 0 );
        expect( FList.getOffset( 0 ) ).toEqual( 0 );
    });

    test( "Summation works correctly", () => {

        FList.setParams( 0, 2, 100, null, null );
        FList.setRowHeight( 20 );

        expect( FList.getOffset( 4 ) ).toBe( 80 );
        expect( FList.getIndex( 110 ) ).toBe( 5 );
    });
});