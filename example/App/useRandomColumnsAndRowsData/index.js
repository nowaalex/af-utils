import { useMemo } from "react";
import Faker from "faker";
import random from "lodash/random";

const useRandomColumnsAndRowsData = ( colCount, rowCount, refreshId ) => useMemo(() => {
    
    const columns = [{
        dataKey: "index",
        label: "Index",
        width: 150,
        background: "#f7f7f7"
    }];

    for( let j = 1; j < colCount; j++ ){
        columns.push({
            dataKey: `dataKey_${j}`,
            label: Faker.name.firstName(),
            background: `rgb(${random(170,220)}, ${random(170,220)}, ${random(170,220)})`
        });
    }

    const rows = rowCount > 0 ? Array( rowCount ) : [];

    for( let j = 0; j < rowCount; j++ ){
        const rowData = { index: j };
        for( let k = 1; k < colCount; k++ ){
            rowData[`dataKey_${k}`] = `${Faker.hacker.noun()} `.repeat( random( 0, j % 5 ) );
        }
        rows[ j ] = rowData;
    }

    const getRowData = rowIndex => rows[ rowIndex ];

    return {
        columns,
        getRowData
    };
}, [ colCount, Math.max( rowCount, 0 ), refreshId ]);

export default useRandomColumnsAndRowsData;