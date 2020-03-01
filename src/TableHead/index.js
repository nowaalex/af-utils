import React, { memo, useCallback } from "react";
import { css } from "emotion";
import { useApiPlugin } from "../useApi";
import Colgroup from "./Colgroup";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed",
    "column-widths-changed",
    "sort-params-changed"
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

        &[data-sortable] {
            cursor: pointer;
            user-select: none;
        }

        &[aria-sort="ascending"]::after {
            content: " ↑"
        }

        &[aria-sort="descending"]::after {
            content: " ↓";
        }
    }
`;


const SortDirections = {
    "1": "ascending",
    "-1": "descending"
};

/*
    TODO:
        When rowCount is 0 - render th's of auto width.
*/
const TableHead = memo(() => {

    const API = useApiPlugin( SUBSCRIBE_EVENTS );

    const clickHandler = useCallback( e => {

        const colIndex = e.target.getAttribute( "aria-colindex" ) - 1;

        if( process.env.NODE_ENV !== "production" && Number.isNaN( colIndex ) ){
            throw new Error( "colIndex attr missing" );
        }

        if( API.columns[ colIndex ].sort ){
            const directionSign = e.target.getAttribute( "aria-sort" ) === "ascending" ? -1 : 1;
            API.setSortParams( colIndex, directionSign );
        }
    }, [ API.columns ]);

    return (
        <table className={wrapperClass} style={{ right: API.scrollLeft }} aria-colcount={API.columns.length}>
            {CachedColgroup}
            <thead onClick={clickHandler}>
                <tr>
                    {API.columns.map(( column, j, cols ) => {
                        if( column.visibility === "hidden" ){
                            return null;
                        }
                        const width = API.tbodyColumnWidths[ j ];
                        const style = j + 1 < cols.length ? { minWidth: width, width, maxWidth: width } : { minWidth: width };
                        return (
                            <th
                                key={column.dataKey}
                                style={style}
                                title={column.title}
                                data-sortable={column.sort?"":undefined}
                                aria-colindex={j+1}
                                aria-sort={API.sortColumnIndex!==j?"none":SortDirections[API.sortDirectionSign]}
                            >
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