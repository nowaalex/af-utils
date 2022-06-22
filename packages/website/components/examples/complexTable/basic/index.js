import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Table } from "@af-utils/react-mobx-table";
import faker from "faker";
import times from "lodash/times";

const rows = times(10000, i => ({
    i,
    fixedRange: i & 15,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    height: 30 + ((i ** 2) & 63),
    country: faker.address.country()
}));

const getRowData = i => rows[i];

const columns = [
    {
        key: "i",
        label: "i",
        totals: "sum",
        width: 170,
        render: (cellData, row) => (
            <div
                style={{
                    color: "#000",
                    textAlign: "center",
                    lineHeight: `${row.height}px`,
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

const getEstimatedItemSize = (oldItemSizes, oldScrollSize) =>
    oldItemSizes.length ? Math.round(oldScrollSize / oldItemSizes.length) : 60;

const ComplexTable = () => (
    <DndProvider backend={HTML5Backend}>
        <Table
            className="min-h-0 basic-table-container"
            itemCount={rows.length}
            getRowData={getRowData}
            getEstimatedItemSize={getEstimatedItemSize}
            columns={columns}
        />
    </DndProvider>
);

export default ComplexTable;
