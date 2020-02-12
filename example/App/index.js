import React, { useReducer, useRef } from "react";
import Faker from "faker";
import random from "lodash/random";
import times from "lodash/times";
import { css } from "@emotion/core";
import Table from "../../src";

const wrapperCss = css`
    display: flex;
    flex-flow: column nowrap;
    height: 90vh;
    font-family: monospace;

    form {
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        label > span {
            display: inline-block;
            width: 160px;
        }
        input, button {
            padding: 0.3em;
            margin: 0.3em;
            width: 200px;
        }
    }

    hr {
        width: 100%;
    }
`;


const tableCss = css`
    flex: 1 1 auto;
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }
    th {
        padding: 1em;
        border-bottom: 1px solid #000;
    }
    td {
        border-bottom: 1px solid rgba( 0,0,0,0.2);
        padding: 0.3em;
    }
`;

const tableReducer = ( oldProps, { widgetHeight, rowCount, colCount }) => {

    const columns = [
        {
            dataKey: "index",
            label: "Index",
            width: 150,
            background: "green"
        },
        ...times( +colCount.value, i => ({
            dataKey: `dataKey_${i}`,
            label: Faker.name.firstName(),
            background: `rgb(${random(170,220)}, ${random(170,220)}, ${random(170,220)})`
        }))
    ];

    const getRow = rowIndex => columns.reduce(( r, c, i ) => {
        if( c.dataKey === "index" ){
            r.index = rowIndex;
        }
        else{
            r[ c.dataKey ] = `${Faker.hacker.noun()} `.repeat( random( 1, rowIndex % 5 ) );
        }
        return r;
    }, {});

    const rows = +rowCount.value > 0 ? times( +rowCount.value, getRow ) : +rowCount.value;

    const getRowData = index => rows[ index ];

    return {
        rowCount: +rowCount.value,
        style: {
            maxHeight: +widgetHeight.value || undefined
        },
        columns,
        getRowData
    };
};

const App = () => {
    
    const [ tableProps, processFields ] = useReducer( tableReducer, null );

    const submitHandler = e => {
        e.preventDefault();
        processFields( e.currentTarget.elements );
    };

    const tableRef = useRef();

    const scrollToRowSubmitHandler = e => {
        e.preventDefault();
        const { value } = e.currentTarget.elements.index;
        tableRef.current.Data.scrollToRow( +value );
    };

    return (
        <div css={wrapperCss}>
            <form onSubmit={submitHandler}>
                <label>
                    <span>widgetHeight:&nbsp;</span>
                    <input type="number" name="widgetHeight" min="0" defaultValue={0} />
                </label>
                <label>
                    <span>rowCount:&nbsp;</span>
                    <input type="number" name="rowCount" min="-1" defaultValue={100} />
                </label>
                <label>
                    <span>colCount:&nbsp;</span>
                    <input type="number" name="colCount" defaultValue={5} min="0" />
                </label>
                <button type="submit">Regenerate</button>
            </form>
            <hr />
            <form onSubmit={scrollToRowSubmitHandler}>
                <label>
                    <span>Scroll to row:&nbsp;</span>
                    <input type="number" name="index" min="0" defaultValue={0} />
                    <button type="submit">Scroll</button>
                </label>
            </form>
            <hr />
            { tableProps ? (
                <Table
                    {...tableProps}
                    ref={tableRef}
                    css={tableCss}
                    rowCountWarningsTable={{ "0": "AA", "-1" :"OO"}}
                />
            ) : null}
        </div>
    );
};

export default App;