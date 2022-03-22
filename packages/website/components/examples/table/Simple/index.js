import { useVirtual, Table } from "@af-utils/react-table";

const columns = [{ key: "a" }, { key: "b" }, { key: "c" }];

const getRowData = i => ({
    a: `cell_a_${i}`,
    b: `cell_b_${i}`,
    c: `cell_c_${i}`
});

const SimpleTable = () => {
    const model = useVirtual({
        itemCount: 10000
    });

    return (
        <Table
            model={model}
            className="basic-table-container"
            getRowData={getRowData}
            columns={columns}
        />
    );
};

export default SimpleTable;
