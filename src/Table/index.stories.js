import React, { useEffect, Fragment, useState, useCallback } from "react";
import { css } from "@emotion/core";
import { observable, runInAction } from "mobx";
import { observer, useObserver, useLocalStore } from "mobx-react-lite";
import Table from "./index";
import r from "lodash/random";
import times from "lodash/times";
import faker from "faker";
import DefaultCellComponent from "./common/Cell";

export default { title: "Table" };

export const FixedTable = () => {

    const rows = times( 90, index => ({
        a: index,
        country: faker.address.country(),
        name: faker.name.firstName(),
        height: r( 40, 200 )
    }));

    return (
        <Table
            fixedSize
            getRowData={i => rows[ i ]}
            totals={{
                a: [ "sum" ],
                country: [ "count" ]
            }}
            rowCount={rows.length}
            columns={[
                {
                    dataKey: "a",
                    label: "a",
                    sort: "numeric"
                },
                {
                    dataKey: "country",
                    label: "country",
                    sort: "locale"
                },
                {
                    dataKey: "name",
                    label: "name",
                    sort: "locale"
                }
            ]}
        />
    );
};

export const LiveUpdatingTable = () => {

    const CellComponent = observer(DefaultCellComponent);

    const hueBlockCss = css`
        padding: 0.5em;
        border-radius: 5px;
    `;

    const wrapperCss = css`
        thead th, tfoot td {
            background: #fff;
        }
    `;

    const renderHue = cellData => (
        <div
            css={hueBlockCss}
            style={{ background: `hsl(${cellData},90%,70%)` }}
        >
            hue:&nbsp;{cellData}
        </div>
    );

    const rowCount = 10000;

    const [ rows ] = useState(() => {
        const res = [];

        for( let j = 0; j < rowCount; j++ ){
            res.push({ n1: 0, n2: 0, n3: 0, n4: r( 30, 130 ) });
        }

        return observable( res );
    });

    const columns = [
        {
            dataKey: "n1",
            label: "N1",
            width: 100,
            render: renderHue
        },
        {
            dataKey: "n2",
            label: "N2",
            width: 100,
            render: renderHue
        },
        {
            dataKey: "n3",
            label: "N3",
            width: 100,
            render: renderHue
        }
    ];
    
    const getRowData = useCallback( index => rows[ index ], [ rows ]);

    useEffect(() => {
        const intervalHandle = setInterval(() => {
            runInAction(() => {
                for( let j = 0, end = rowCount / 4 | 0; j < end; j++ ){
                    for( let i = 0; i < columns.length; i++ ){
                        rows[r(0,rowCount-1)][ `n${i+1}` ] = r( 0, 360 );
                    }
                }
            });
        }, 500 );

        return () => {
            clearInterval( intervalHandle );
        };
    }, [ rows ]);

    return (
        <Table
            css={wrapperCss}
            CellComponent={CellComponent}
            getRowData={getRowData}
            getRowExtraProps={ r => ({ style: { lineHeight: r.n4 + "px" }})}
            rowCount={rowCount}
            columns={columns}
            totals={{
                n1: [ "sum", "average", "count" ],
                n2: [ "sum", "average" ],
                n3: [ "sum", "average" ]
            }}
        />
    );
};

export const AddRemoveRows = () => useObserver(() => {

    const getRow = useCallback( index => ({
        a: index,
        k: Math.random(),
        country: faker.address.country(),
        name: faker.name.firstName(),
        height: r( 40, 200 )
    }), []);

    const rows = useLocalStore(() => ({
        list: times( 90, getRow ),
        get length(){
            return rows.list.length;
        },
        add(){
            for( let j = 0; j < 3000; j++ ){
                rows.list.push( getRow( j ) );
            }
        },
        remove(){
            rows.list.splice( 1, 1 );
            rows.list.pop();
        }
    }));

    const getRowData = useCallback( i => rows.list[ i ], []);

    const getRowKey = useCallback( i => rows.list[ i ].k, []);

    return (
        <Fragment>
            <button onClick={() => rows.add()}>Append 3000 rows</button>
            <button onClick={() => rows.remove()}>Remove 2nd row</button>
            <Table
                getRowData={getRowData}
                getRowKey={getRowKey}
                totals={{
                    a: [ "sum" ],
                    country: [ "count" ]
                }}
                rows={rows}
                columns={[
                    {
                        dataKey: "a",
                        label: "a",
                        sort: "numeric"
                    },
                    {
                        dataKey: "country",
                        label: "country",
                        sort: "locale"
                    },
                    {
                        dataKey: "name",
                        label: "name",
                        sort: "locale"
                    }
                ]}
            />
        </Fragment>
    );
});