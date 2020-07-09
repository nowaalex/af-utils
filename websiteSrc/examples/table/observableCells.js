import React, { memo, useEffect, useState, useCallback } from "react";
import { observable } from "mobx";
import { observer } from "mobx-react-lite";
import Table from "af-virtual-scroll/lib/Table";
import DefaultCellComponent from "af-virtual-scroll/lib/Table/common/Cell";
import r from "lodash/random";
import { css } from "@emotion/core";

const hueBlockCss = css`
    padding: 0.5em;
    border-radius: 5px;
`;

const renderHue = cellData => (
    <div
        css={hueBlockCss}
        style={{ background: `hsl(${cellData},90%,70%)` }}
    >
        hue:&nbsp;{cellData}
    </div>
)

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

const rowCount = 200;

const CellComponent = memo(observer(DefaultCellComponent))

const TableWithObservableRows = ({ className }) => {

    const [ rows ] = useState(() => {
        const r = observable([]);

        for( let j = 0; j < rowCount; j++ ){
            r.push({ n1: 0, n2: 0, n3: 0 });
        }

        return r;
    });

    /* useCallback prevents table from unnecessary rerenders */
    const getRowData = useCallback( index => rows[ index ], [ rows ]);

    useEffect(() => {
        const intervalHandle = setInterval(() => {
            for( let j = 0; j < 50; j++ ){
                rows[r(0,rowCount-1)][ `n${r(1,3)}` ] = r( 0, 360 );
            }
        }, 1000 );

        return () => {
            clearInterval( intervalHandle );
        };
    }, [ rows ]);

    return (
        <Table
            className={className}
            CellComponent={CellComponent}
            getRowData={getRowData}
            rowCount={rowCount}
            columns={columns}
        />
    );
};

export default TableWithObservableRows;