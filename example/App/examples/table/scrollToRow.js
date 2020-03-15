import React, { useRef } from "react";
import Table from "af-react-table/lib/Table";
import { css } from "@emotion/core";

const wrapperCss = css`
    display: flex;
    flex: 1 1 auto;
    flex-flow: column nowrap;
`;

const columns = [
    {
        dataKey: "a",
        label: "a"
    },
    {
        dataKey: "b",
        label: "b"
    },
    {
        dataKey: "c",
        label: "c"
    }
];

const getRowData = index => ({
    a: index,
    b: `cell_b_row: ${index}`,
    c: `cell_c_row: ${index}`
})

const TableWithScrollToRowButton = () => {

    const dataRef = useRef();

    const submitHandler = e => {
        e.preventDefault();
        const v = e.currentTarget.elements.scrollRow.value;
        dataRef.current.scrollToRow( +v );
    };

    return (
        <div css={wrapperCss}>
            <form onSubmit={submitHandler}>
                <label>
                    Row:&nbsp;
                    <input
                        name="scrollRow"
                        type="number"
                        defaultValue="0"
                        step="10"
                    />
                </label>
                <button type="submit">
                    Scroll
                </button>
            </form>
            <Table
                dataRef={dataRef}
                getRowData={getRowData}
                rowCount={50000}
                columns={columns}
            />
        </div>
    );
};

export default TableWithScrollToRowButton;