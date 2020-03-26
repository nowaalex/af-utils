import VariableSizeList from "./VariableSizeList";

describe( "Segments tree works correctly", () => {

    test( "It initialies properly", () => {

        const VList = new VariableSizeList();
        VList.set( "totalRows", 50 ).set( "estimatedRowHeight", 5 );
        expect(VList.getDistanceBetweenIndexes( 2, 7)).toEqual(25);
    });
});