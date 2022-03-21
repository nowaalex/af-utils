import { useVirtual, Table } from "@af-utils/react-table";

const SimpleHeadlessTable = () => {

    const model = useVirtual({
        itemCount: 1000,
    });

    return (
        <Table
            model={model}
            className="basic-table-container"
            headless
            getRowData={i => ({
                a: `cell_a_${i}`,
                b: `cell_b_${i}`,
                c: `cell_c_${i}`
            })}
            columns={[
                { key: "a", label: "a" },
                { key: "b", label: "b" },
                { key: "c", label: "c" }
            ]}
        />
    );
}

export default SimpleHeadlessTable;