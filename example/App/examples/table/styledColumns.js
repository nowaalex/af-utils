import Table from "af-react-table/lib/Table";
import times from "lodash/times";
import range from "lodash/range";
import r from "lodash/random";

const colCount = 5;

const columns = times( colCount, colIndex => ({
    dataKey: `col${colIndex}`,
    label: `col${colIndex}`,
    background: `rgb(${r(170,220)}, ${r(170,220)}, ${r(170,220)})`,
    width: r( 50, 300 )
}));

const getRowData = index => range( colCount ).reduce(( acc, colIndex ) => {
    acc[ `col${colIndex}` ] = index;
    return acc;
}, {});

const TableWithStyledColumns = () => (
    <Table
        useStickyIfPossible
        getRowData={getRowData}
        rowCount={500}
        columns={columns}
    />
);

export default TableWithStyledColumns;