import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { Table } from "@af-utils/react-mobx-table";
import {
    seed,
    randFirstName,
    randLastName,
    randNumber,
    randCountry
} from "@ngneat/falso";

// fake data should be consistent for ssr purpose
seed(5);

const rows = Array.from({ length: 10000 }, (_, i) => ({
    i: i - 5000,
    fixedRange: i & 15,
    firstName: randFirstName(),
    lastName: randLastName(),
    height: randNumber({ max: 90, min: 30 }),
    country: randCountry()
}));

const getRowData = i => rows[i];

const columns = [
    {
        sorter: "numeric",
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

const ComplexTable = () => (
    <DndProvider backend={HTML5Backend}>
        <Table
            className="h-full basic-table-container"
            itemCount={rows.length}
            getRowData={getRowData}
            estimatedItemSize={60}
            columns={columns}
        />
    </DndProvider>
);

export default ComplexTable;
