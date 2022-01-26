import { Table, useVirtual } from  "af-virtual-scroll";

// import once in a project ( not needed for hook )
// import "af-virtual-scroll/lib/style.css";

const SimpleTable = () => {

    const model = useVirtual({
        itemCount: 1000
    });

    return (
        <Table
            model={model}
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
}

export default SimpleTable;