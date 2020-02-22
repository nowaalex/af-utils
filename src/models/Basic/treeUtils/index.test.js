import { walkUntil, sum, reallocateIfNeeded } from "./index";

describe( "Segments tree works correctly", () => {

    test( "It initialies properly", () => {

        const tree = reallocateIfNeeded( null, 10, 5 );
        expect(sum( 2, 7, tree)).toEqual(25);
    });
});