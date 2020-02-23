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

        &[data-sort-type] {
            cursor: pointer;
            user-select: none;
        }

        &[aria-sort]::after {
            float: right;
        }

        &[aria-sort="ascending"]::after {
            content: "↑"
        }

        &[aria-sort="descending"]::after {
            content: "↓";
        }
    }
`;

const getAriaSortAttribute = ( sortField, sortDirectionSign, dataKey ) => {
    if( sortField !== dataKey ){
        return "none";
    }

    return sortDirectionSign === 1 ? "ascending" : "descending";
};

/*
    TODO:
        When rowCount is 0 - render th's of auto width.
*/
const TableHead = memo(() => {

    const API = useApiPlugin( SUBSCRIBE_EVENTS );

    const clickHandler = e => {
        const sortType = e.target.getAttribute( "data-sort-type" );
        if( sortType ){
            const colKey = e.target.getAttribute( "data-column-key" );
            const directionSign = e.target.getAttribute( "aria-sort" ) === "ascending" ? -1 : 1;
            API.setSortParams( colKey, sortType, directionSign );
        }
    };

    return (
        <table className={wrapperClass} style={{ right: API.scrollLeft }}>
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
                                data-sort-type={column.sort}
                                data-column-key={column.dataKey}
                                aria-sort={getAriaSortAttribute(API.sortField,API.sortDirectionSign,column.dataKey)}
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