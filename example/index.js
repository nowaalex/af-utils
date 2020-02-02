import React, { useState } from "react";
import { render } from "react-dom";
import Faker from "faker";
import random from "lodash/random";
import times from "lodash/times";
import { css } from "@emotion/core";
import Table from "../src";

const rootNode = document.createElement( "div" );
document.body.appendChild( rootNode );

const tableCss = css`
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }
`;

const getTableColsAndData = () => {
    const columns = [
        {
            dataKey: "index",
            label: "Index",
            width: 150,
            background: "green"
        },
        ...times( random( 6, 10 ), i => ({
            dataKey: `dataKey_${i}`,
            label: Faker.name.firstName(),
            width: 200
            //background: random( 0, 7 ) > 2 ? `rgb(${random(170,220)}, ${random(170,220)}, ${random(170,220)})` : undefined
        }))
    ];

    const getRow = rowIndex => columns.reduce(( r, c, i ) => {
        if( c.dataKey === "index" ){
            r.index = rowIndex;
        }
        else{
            r[ c.dataKey ] = `${Faker.hacker.noun()} `.repeat( random( 1, rowIndex % 4 ) );
        }
        return r;
    }, {});

    const rows = times( 5000, getRow );

    const getRowData = index => rows[ index ];

    return {
        rowCount: rows.length,
        columns,
        getRowData
    };
};

const A = () => {
    
    const [ tableHeight, setHeight ] = useState( 400 );

    return (
        <div>
            <button onClick={() => setHeight(random(400, 600))}>Change height</button>
            <Table {...getTableColsAndData()} style={{ height: tableHeight }} css={tableCss} />
        </div>
    );
};

render( <A />, rootNode );