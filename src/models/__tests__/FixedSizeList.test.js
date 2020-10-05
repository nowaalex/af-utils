import FixedSizeList from "../FixedSizeList";

describe( "FixedSizeList model works correctly", () => {

    const FList = new FixedSizeList();

    test( "It initializes properly", () => {
        FList.merge({
            rowCount: 50,
            estimatedRowHeight: 5
        });
        expect(FList.widgetScrollHeight).toEqual(0);
    });

    test.each`
        distance  | expectedResult
        ${23}     | ${[4,3]}
        ${20}     | ${[4,0]}
        ${1}      | ${[0,1]}
        ${0}      | ${[0,0]}
        ${78}     | ${[15,3]}
    `(
        "getVisibleRangeStart works ok for distance: $distance",
        ({ distance, expectedResult }) => {
            expect(FList.getVisibleRangeStart(distance)).toEqual(expectedResult);
        }
    );

    test.each`
        startIndex | endIndex | expectedResult
        ${0}       | ${0}     | ${0}
        ${4}       | ${6}     | ${10}
        ${1}       | ${10}    | ${45}
    `(
        "getDistanceBetweenIndexes works ok for range: [ $startIndex - $endIndex ]",
        ({ startIndex, endIndex, expectedResult }) => {
            expect(FList.getDistanceBetweenIndexes(startIndex,endIndex)).toEqual(expectedResult);
        }
    );
});