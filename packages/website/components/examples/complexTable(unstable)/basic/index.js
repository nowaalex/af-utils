import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Table } from "@af-utils/react-mobx-table";
import faker from "faker";

const rows = Array.from({ length: 10000 }, (v, i) => ({
    i,
    fixedRange: i & 15,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    country: faker.address.country()
}));

const getRowData = i => rows[i];

/* Math.random is not the best option, because same rowIndex should produce same height */
const getPureRandomLineHeight = rowIndex => 20 + (rowIndex & 63);

const columns = [
    {
        key: "i",
        label: "i",
        totals: "sum",
        width: 170,
        render: cellData => (
            <div
                style={{
                    color: "#000",
                    textAlign: "center",
                    lineHeight: `${getPureRandomLineHeight(cellData)}px`,
                    background: `hsl(${(cellData * 11) % 360},60%,60%)`
                }}
            >
                {cellData}
            </div>
        )
    },
    {
        key: "fixedRange",
        render: v => `fr ${v}`,
        label: "FR",
        initialGroupingIndex: 1,
        align: "center",
        priorityGroupValues: [4, 7, 71, 5]
    },
    {
        key: "firstName",
        label: "first name",
        initialGroupingIndex: 2,
        align: "center",
        priorityGroupValues: ["Dennis"],
        totals: "count"
    },
    { key: "lastName", label: "last name", align: "center" },
    { key: "country", label: "country", align: "center", width: "40%" }
];

const ComplexTable = () => (
    <DndProvider backend={HTML5Backend}>
        <Table
            className="min-h-0 basic-table-container"
            itemCount={rows.length}
            getRowData={getRowData}
            estimatedItemSize={30}
            columns={columns}
        />
    </DndProvider>
);

export default ComplexTable;
