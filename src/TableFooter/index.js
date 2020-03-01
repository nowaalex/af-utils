import React, { memo } from "react";
import { css } from "emotion";
import capitalize from "lodash/capitalize";
import { useApiPlugin } from "../useApi";
import Colgroup from "./Colgroup";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "scroll-left-changed",
    "column-widths-changed",
    "totals-changed",
    "totals-calculated",
    "total-rows-changed"
];

const CachedColgroup = <Colgroup />;

const wrapperClass = css`
    flex: 0 0 auto;
    min-width: 100%;
    position: relative;
    table-layout: fixed;

    td {
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

const TableFooter = memo(() => {

    const { scrollLeft, columns, tbodyColumnWidths, totals, totalsCache } = useApiPlugin( SUBSCRIBE_EVENTS );

    return (
        <table className={wrapperClass} style={{ right: scrollLeft }} aria-colcount={columns.length}>
            {CachedColgroup}
            <tfoot>
                <tr>
                    {columns.map(({ dataKey, visibility }, j, cols ) => {

                        if( visibility === "hidden" ){
                            return null;
                        }

                        const width = tbodyColumnWidths[ j ];
                        const style = j + 1 < cols.length ? { minWidth: width, width, maxWidth: width } : { minWidth: width };
                        const curTotals = totals[ dataKey ];
                        const curTotalsCache = totalsCache[ dataKey ];

                        return (
                            <td key={dataKey} style={style}>
                                {curTotals&&curTotalsCache&&curTotals.map(t => {
                                    const res = curTotalsCache[t];
                                    return res ? <div key={t}>{capitalize(t)}:&nbsp;{res}</div> : null;
                                })}
                            </td>
                        );
                    })}
                </tr>
            </tfoot>
        </table>
    );
});

export default TableFooter;