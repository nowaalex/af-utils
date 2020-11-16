import Table from  "af-virtual-scroll/Table";

const SimpleTable = () => (
    <Table
        rowsQuantity={1000}
        getRowData={i => ({ a: `cell_a_${i}`, b: `cell_b_${i}`, c: `cell_c_${i}` })}
        columns={[ "a", "b", "c" ]}
    />
);

export default SimpleTable;