import { useVirtual, Table } from "@af/react-table";

import { css } from "@emotion/css";
import Paper from '@mui/material/Paper';
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
        label: "Col a",
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

/*
    If you place Table inside block container,
    you must specify height somehow.
*/
const fullHeightClass = css`height: 100%;`;

const SimpleTable = () => {

    const model = useVirtual({
        itemCount: 10000
    });

    return (
        <MuiTableContainer component={Paper}>
            <Table
                className={fullHeightClass}
                model={model}
                components={components}
                getRowData={getRowData}
                columns={columns}
            />
        </MuiTableContainer>
    );
}

export default SimpleTable;