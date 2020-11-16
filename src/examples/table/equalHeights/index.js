import Table from  "af-virtual-scroll/Table";


/*
    Initial dimensions are not required, but flex-grow/min-width/smth. should be set,
    because otherwise List may collapse to zero-width
*/

const SimpleTable = () => (
    <Table
        fixed
        columns={[ "a", "b", "c" ]}
        getRowData={i => ({ a: `cell_a_${i}`, b: `cell_b_${i}`, c: `cell_c_${i}` })}
        rowsQuantity={1000}
    />
);

export default SimpleTable;