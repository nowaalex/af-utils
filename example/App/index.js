import React, { useReducer } from "react";
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
`;


const tableCss = css`
    flex: 1 1 auto;
    table {
        border-collapse: collapse;
        border-spacing: 0;
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
            width: 200,
            background: `rgb(${random(170,220)}, ${random(170,220)}, ${random(170,220)})`
        }))
    ];

    const getRow = rowIndex => columns.reduce(( r, c, i ) => {
        if( c.dataKey === "index" ){
            r.index = rowIndex;
        }
        else{
            r[ c.dataKey ] = `${Faker.hacker.noun()} `.repeat( random( 1, rowIndex % 15 ) );
        }
        return r;
    }, {});

    const rows = +rowCount.value > 0 ? times( +rowCount.value, getRow ) : +rowCount.value;

    const getRowData = index => rows[ index ];

    return {
        rowCount: +rowCount.value,
        style: {
            maxHeight: +widgetHeight.value || "auto"
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
    }

    return (
        <div css={wrapperCss}>
            <form onSubmit={submitHandler}>
                <label>
                    <span>widgetHeight:&nbsp;</span>
                    <input type="number" name="widgetHeight" defaultValue={0} />
                </label>
                <label>
                    <span>rowCount:&nbsp;</span>
                    <input type="number" name="rowCount" defaultValue={1000} />
                </label>
                <label>
                    <span>colCount:&nbsp;</span>
                    <input type="number" name="colCount" defaultValue={5} />
                </label>
                <button type="submit">Regenerate</button>
            </form>
            { tableProps ? (
                <Table {...tableProps} css={tableCss} rowCountWarningsTable={{ "0": "AA", "-1" :"OO"}} />
            ) : null}
        </div>
    );
};

export default App;