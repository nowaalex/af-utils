import { useVirtual, Table } from "@af-utils/react-table";

import Paper from "@mui/material/Paper";
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
        <MuiTableContainer component={Paper} className="h-full not-prose">
            <Table
                className="h-full"
                model={model}
                components={components}
                getRowData={getRowData}
                columns={columns}
            />
        </MuiTableContainer>
    );
};

export default SimpleTable;
