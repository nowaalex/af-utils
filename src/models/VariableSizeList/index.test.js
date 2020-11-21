import VariableSizeList from "./index";

describe( "VariableSizeList works ok", () => {

    test( "it sums ok", () => {

        const VSList = new VariableSizeList();
        VSList.setViewParams( 0, 2, 7, null );

        VSList.updateRowHeight( 0, 10 );
        VSList.updateRowHeight( 1, 20 );
        VSList.updateRowHeight( 2, 30 );
        VSList.updateRowHeight( 3, 40 );
        VSList.updateRowHeight( 4, 50 );

        expect( VSList.getOffset( 4 ) ).toBe( 100 );

        VSList.updateRowHeight( 1, 36 );

        expect( VSList.getOffset( 2 ) ).toBe( 66 );

        expect( VSList.getIndex( 67 ) ).toBe( 2 );
        expect( VSList.getIndex( 95 ) ).toBe( 2 );
    });
})