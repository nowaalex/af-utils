import FenwickTree from "./index";

describe( "FenwickTree works ok", () => {

    test( "it sums ok", () => {

        const fTree = new FenwickTree();

        fTree.growIfNeeded( 7 );

        fTree.set( 0, 10 );
        fTree.set( 1, 20 );
        fTree.set( 2, 30 );
        fTree.set( 3, 40 );
        fTree.set( 4, 50 );

        expect( fTree.sum( 4 ) ).toBe( 100 );

        fTree.set( 1, 56 );

        expect( fTree.sum( 2 ) ).toBe( 66 );

        expect( fTree.find( 67 ) ).toBe( 2 );
        expect( fTree.find( 95 ) ).toBe( 2 );
    });
})