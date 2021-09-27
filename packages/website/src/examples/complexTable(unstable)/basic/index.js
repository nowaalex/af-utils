import { Table } from "af-react-table";
import faker from "faker";

const rows = Array.from({ length: 10000 }, (v, i) => ({
    i,
    fixedRange: i % 9,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    country: faker.address.country()
}));

/* Math.random is not the best option, because same rowIndex should produce same height */
const getPureRandomLineHeight = rowIndex => 20 + ( rowIndex % 53 ) + ( rowIndex % 87 );

const ComplexTable = () => (
    <Table
        rowsQuantity={rows.length}
        getRowData={i => rows[ i ]}
        estimatedRowHeight={30}
        columns={[
            {
                dataKey: "i",
                label: "i",
                totals: "sum",
                render: cellData => (
                    <div style={{
                        color: "#000",
                        textAlign: "center",
                        lineHeight: `${getPureRandomLineHeight(cellData)}px`,
                        background: `hsl(${cellData*11%360},60%,60%)`
                    }}>
                        {cellData}
                    </div>
                )
            },
            {
                dataKey: "fixedRange",
                render: v => `fr ${v}`,
                label: "FR",
                initialGroupingIndex: 1,
                priorityGroupValues: [ 4, 7, 71, 5 ]
            },
            {
                dataKey: "firstName",
                label: "first name",
                initialGroupingIndex: 2,
                priorityGroupValues: [ "Dennis" ],
                totals: "count"
            },
            { dataKey: "lastName", label: "last name" },
            { dataKey: "country", label: "country" }
        ]}
    />
);

export default ComplexTable;