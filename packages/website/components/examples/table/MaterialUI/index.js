import { useVirtual, Table } from "@af-utils/react-table";

import MuiTableContainer from "@mui/material/TableContainer";
import MuiTable from "@mui/material/Table";
import MuiTableBody from "@mui/material/TableBody";
import MuiTableHead from "@mui/material/TableHead";
import MuiTableCell from "@mui/material/TableCell";
import MuiTableRow from "@mui/material/TableRow";

const components = {
    /*
        border-collapse works bad with sticky headers,
        so stickyHeader is a must unless your table is headless
    */
    Table: props => <MuiTable {...props} stickyHeader />,
    Tbody: MuiTableBody,
    Thead: MuiTableHead,
    Tr: MuiTableRow,
    Td: MuiTableCell,
    Th: MuiTableCell
};

const columns = [
    {
        key: "a",
        label: "Col a"
    },
    {
        key: "b",
        label: "Col b",
        align: "center"
    },
    {
        key: "c",
        label: "Col c",
        align: "right"
    }
];

const getRowData = i => ({
    a: `cell a ${i}`,
    b: `cell b ${i}`,
    c: `cell c ${i}`
});

const SimpleTable = () => {
    const model = useVirtual({
        itemCount: 100000
    });

    /*
        If you place Table inside block container,
        you must specify height: 100% by adding style/className.
    */
    return (
        <div className="h-full not-prose flex flex-col gap-4">
            <form
                className="shrink-0 flex gap-4 p-2 bg-gray-200"
                onSubmit={e => {
                    e.preventDefault();
                    model.scrollTo(+e.currentTarget.idx.value, true);
                }}
            >
                <input type="number" min={0} max={99999} name="idx" />
                <button type="submit">Scroll</button>
            </form>
            <MuiTableContainer className="grow">
                <Table
                    className="h-full"
                    model={model}
                    components={components}
                    getRowData={getRowData}
                    columns={columns}
                />
            </MuiTableContainer>
        </div>
    );
};

export default SimpleTable;
