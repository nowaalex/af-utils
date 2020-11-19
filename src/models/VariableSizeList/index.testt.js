import FenwickTree from "./index";

describe( "FenwickTree works ok", () => {

    test( "it sums ok", () => {

        const fTree = new FenwickTree();

        fTree.grow( 7 );

        fTree.update( 0, 10 );
        fTree.update( 1, 20 );
        fTree.update( 2, 30 );
        fTree.update( 3, 40 );
        fTree.update( 4, 50 );

        expect( fTree.sum( 4 ) ).toBe( 100 );

        fTree.update( 1, 36 );

        expect( fTree.sum( 2 ) ).toBe( 66 );

        expect( fTree.find( 67 ) ).toBe( 2 );
        expect( fTree.find( 95 ) ).toBe( 2 );
    });
})