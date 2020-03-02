import React from "react";
import capitalize from "lodash/capitalize";
import useApi from "../../../useApi";

const SUBSCRIBE_EVENTS = [
    "columns-changed",
    "totals-changed",
    "totals-calculated"
];

const FooterCells = () => {

    const { columns, totals, totalsCache } = useApi( SUBSCRIBE_EVENTS );

    return columns.map(({ dataKey, visibility }) => {

        if( visibility === "hidden" ){
            return null;
        }

        const curTotals = totals[ dataKey ];
        const curTotalsCache = totalsCache[ dataKey ];

        return (
            <td key={dataKey}>
                {curTotals&&curTotalsCache&&curTotals.map( summaryType => {
                    const res = curTotalsCache[ summaryType ];
                    return res ? (
                        <div key={summaryType}>
                            {capitalize(summaryType)}:&nbsp;{res}
                        </div>
                    ) : null;
                })}
            </td>
        );
    });
};

const FooterCellsCached = <FooterCells />;

export default FooterCellsCached;