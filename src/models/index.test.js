import VariableSizeList from "./VariableSizeList";

describe( "Segments tree works correctly", () => {

    const VList = new VariableSizeList();

    test( "It initialies properly", () => {
        VList.set( "totalRows", 50 ).set( "estimatedRowHeight", 5 );
        expect(VList.getDistanceBetweenIndexes( 2, 7)).toEqual(25);
    });

    test.each`
        rowCount | rowHeight | randomNumber | randomIndex
        ${50}    | ${50}     | ${50}        | ${0}
        ${0}     | ${17}     | ${91}        | ${7}
        ${70}    | ${15}     | ${50}        | ${32}
        ${72}    | ${17}     | ${12}        | ${2}
        ${200}   | ${55}     | ${100}       | ${100}
        ${2}     | ${55}     | ${100}       | ${0}
        ${198}   | ${25}     | ${10}        | ${12}
        ${10}    | ${13}     | ${70}        | ${1}
        ${700}   | ${31}     | ${57}        | ${3}
        ${699}   | ${30}     | ${57}        | ${3}
        ${698}   | ${29}     | ${57}        | ${1}
        ${699}   | ${39}     | ${57}        | ${3}
        ${700}   | ${17}     | ${91}        | ${7}
        ${0}     | ${17}     | ${91}        | ${7}
        ${2}     | ${1}      | ${91}        | ${0}
    `(
        "Reallocates ok for [ $rowCount * $rowHeight, randomNumber: $randomNumber, randomIndex: $randomIndex ]",
        ({ rowCount, rowHeight, randomNumber, randomIndex }) => {
            VList.set( "totalRows", rowCount ).set( "estimatedRowHeight", rowHeight );
            expect(VList.getDistanceBetweenIndexes( 0, rowCount )).toEqual( rowCount * rowHeight );

            if( rowCount ){
                VList.sTree[ VList.N + randomIndex ] = randomNumber;
                VList.sTree[ VList.N + randomIndex + 1 ] = randomNumber;
                VList.calculateParentsInRange( randomIndex, randomIndex + 1 );
                expect(VList.getDistanceBetweenIndexes( 0, rowCount )).toEqual( ( rowCount - 2 ) * rowHeight + randomNumber * 2 );
            }
        });
});