import React, { memo } from "react";
import { css } from "emotion";
import { useApiPlugin } from "../useApi";
import Colgroup from "./Colgroup";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed",
    "column-widths-changed",
];

const CachedColgroup = <Colgroup />;

const wrapperClass = css`
    flex: 0 0 auto;
    min-width: 100%;
    position: relative;
    table-layout: fixed;

    th {
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;


const TableHead = memo(() => {

    const { columns, scrollLeft, tbodyColumnWidths } = useApiPlugin( SUBSCRIBE_EVENTS );

    return (
        <table className={wrapperClass} style={{ right: scrollLeft }}>
            {CachedColgroup}
            <thead>
                <tr>
                    {columns.map(( column, j, cols ) => {
                        if( column.visibility === "hidden" ){
                            return null;
                        }
                        const width = tbodyColumnWidths[ j ];
                        const style = j + 1 < cols.length ? { minWidth: width, width, maxWidth: width } : { minWidth: width };
                        return (
                            <th key={column.dataKey} style={style} title={column.title}>
                                {column.label}
                            </th>
                        );
                    })}
                </tr>
            </thead>
        </table>
    );
});

export default TableHead;