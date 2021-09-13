import { Table } from  "af-virtual-scroll";

const SimpleTable = () => (
    <Table
        rowsQuantity={1000}
        getRowData={i => ({
            a: `cell_a_${i}`,
            b: `cell_b_${i}`,
            c: `cell_c_${i}`
        })}
        columns={[
            { dataKey: "a", label: "a" },
            { dataKey: "b", label: "b" },
            { dataKey: "c", label: "c" }
        ]}
    />
);

export default SimpleTable;