import React from "react";
import { render } from "react-dom";
import Faker from "faker";
import random from "lodash/random";
import times from "lodash/times";
import Table from "../src";

const rootNode = document.createElement( "div" );
document.body.appendChild( rootNode );

const getTableColsAndData = () => {
    const columns = times( random( 9, 12 ), i => ({
        dataKey: `dataKey_${i}`,
        label: Faker.name.firstName(),
        width: i === 0 ? 200 : "auto",
        //background: random( 0, 7 ) > 2 ? `rgb(${random(170,220)}, ${random(170,220)}, ${random(170,220)})` : undefined
    }));

    const getRow = () => columns.reduce(( r, c, i ) => {
        r[ c.dataKey ] = Faker.random.alphaNumeric( random( i + 1, ( i + 1 ) * 1.2 | 0 ) );
        return r;
    }, {});

    const rows = times( random( 300, 500 ), getRow );

    const getRowData = index => rows[ index ];

    return {
        rowCount: rows.length,
        columns,
        getRowData
    };
}

const A = () => (
    <Table virtualizedScroll {...getTableColsAndData()} width={800} height={600} />
);

render( <A />, rootNode );