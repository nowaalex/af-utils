import { Table, useVirtual } from  "af-virtual-scroll";

const EqualHeightsTable = () => {

    const model = useVirtual({
        itemCount: 1000
    })
    
    return (
        <Table
            model={model}
            getRowData={i => ({
                a: `cell_a_${i}`,
                b: `cell_b_${i}`,
                c: `cell_c_${i}`
            })}
            columns={[
                { dataKey: "a", label: "a", width: "100em" },
                { dataKey: "b", label: "b" },
                { dataKey: "c", label: "c" }
            ]}
        />
    );
}

export default EqualHeightsTable;