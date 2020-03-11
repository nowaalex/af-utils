import React from "react";
import capitalize from "lodash/capitalize";
import useApi from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "#columns",
    "#totals",
    "totals-calculated"
];

const FooterCells = () => {

    const { columns, totals, totalsCache } = useApi( SUBSCRIBE_EVENTS );

    return columns.map(({ dataKey, formatTotal, visibility }, j ) => {

        if( visibility === "hidden" ){
            return null;
        }

        const curTotals = totals[ dataKey ];
        const curTotalsCache = totalsCache[ dataKey ];

        return (
            <td key={dataKey} aria-colindex={j+1}>
                {curTotals&&curTotalsCache&&curTotals.map( summaryType => {
                    const res = curTotalsCache[ summaryType ];
                    return res !== undefined ? (
                        <div key={summaryType}>
                            {capitalize(summaryType)}:&nbsp;{formatTotal?formatTotal(res):res}
                        </div>
                    ) : null;
                })}
            </td>
        );
    });
};

const FooterCellsCached = <FooterCells />;

export default FooterCellsCached;