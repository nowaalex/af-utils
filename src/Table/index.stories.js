import React from "react";
import Table from "./index";
import r from "lodash/random";
import times from "lodash/times";
import faker from "faker";

export default { title: "Table" };

const DEFAULT_ROW_COUNT = 5000;

const columns = [
    {
        dataKey: "a",
        label: "a",
        sort: "numeric"
    },
    {
        dataKey: "country",
        label: "country",
        sort: "locale"
    },
    {
        dataKey: "name",
        label: "name",
        sort: "locale"
    }
];

const rows = times( DEFAULT_ROW_COUNT, index => ({
    a: index,
    country: faker.address.country(),
    name: faker.name.firstName(),
    height: r( 40, 200 )
}));

export const FixedTable = () => (
    <Table
        fixedSize
        getRowData={i => rows[ i ]}
        totals={{
            a: [ "sum" ],
            country: [ "count" ]
        }}
        rowCount={DEFAULT_ROW_COUNT}
        columns={columns}
    />
);