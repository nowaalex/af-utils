import Table from "af-react-table/lib/Table";

const columns = [
    {
        dataKey: "a",
        label: "a"
    },
    {
        dataKey: "b",
        label: "b"
    },
    {
        dataKey: "c",
        label: "c"
    }
];

const getRowData = index => ({
    a: index,
    b: `cell_b_row: ${index}`,
    c: `cell_c_row: ${index}`
})

const SimpleTable = () => (
    <Table
        getRowData={getRowData}
        rowCount={500}
        columns={columns}
    />
);

export default SimpleTable;