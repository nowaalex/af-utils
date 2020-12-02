import { ComplexTable as Table } from  "af-virtual-scroll";
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
                totals: "sum",
                render: ( cellData, rowData, rowIndex ) => (
                    <div style={{
                        color: "#000",
                        textAlign: "center",
                        lineHeight: `${getPureRandomLineHeight(rowIndex)}px`,
                        background: `hsl(${rowIndex*11%360},60%,60%)`
                    }}>
                        {cellData}
                    </div>
                )
            },
            {
                dataKey: "fixedRange",
                priorityGroupValues: [ 4, 7, 5 ]
            },
            {
                dataKey: "firstName",
                totals: "count"
            },
            "lastName",
            "country"
        ]}
    />
);

export default ComplexTable;